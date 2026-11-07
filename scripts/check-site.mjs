import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { queensTrace, alignPoses, poseSequenceA, poseSequenceB } from '../assets/diagram-models.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frames = queensTrace(4);
assert(frames.some(frame => frame.kind === 'dead-end'), 'The demonstration must show a real dead end.');
assert(frames.some(frame => frame.kind === 'backtrack'), 'The demonstration must show a real backtrack.');
for (const frame of frames) {
  const positions = frame.positions;
  for (let r = 0; r < positions.length; r++) {
    for (let s = r + 1; s < positions.length; s++) {
      assert.notEqual(positions[r], positions[s], 'Queens must not share a column.');
      assert.notEqual(Math.abs(positions[r] - positions[s]), s - r, 'Queens must not share a diagonal.');
    }
  }
  for (let c = 0; c < 4 && positions.length < 4; c++) {
    const safe = positions.every((other, r) => other !== c && Math.abs(other - c) !== positions.length - r);
    if (frame.available & (1 << c)) assert(safe, 'Every offered square must be legal.');
    if (frame.kind !== 'backtrack') assert.equal(Boolean(frame.available & (1 << c)), safe, 'The bit mask must match geometric constraints.');
  }
}
assert.equal(frames.at(-1).kind, 'solved');
assert.equal(frames.at(-1).positions.length, 4);
assert.equal(queensTrace(1).at(-1).kind, 'solved');
assert(!queensTrace(2).some(frame => frame.kind === 'solved'));

const path = alignPoses(poseSequenceA, poseSequenceB);
assert.deepEqual(path[0], [0, 0]);
assert.deepEqual(path.at(-1), [poseSequenceA.length-1, poseSequenceB.length-1]);
for (let i = 0; i < path.length; i++) {
  const [a, b] = path[i];
  assert.equal(poseSequenceA[a], poseSequenceB[b], 'The example must align matching poses.');
  if (i) {
    const da = a - path[i-1][0], db = b - path[i-1][1];
    assert(da >= 0 && da <= 1 && db >= 0 && db <= 1 && da + db > 0, 'DTW must follow a monotone, continuous path.');
  }
}
assert.deepEqual(alignPoses([], [1]), []);
assert.deepEqual(alignPoses([1], [1, 1]), [[0, 0], [0, 1]]);

for (const name of ['index.html', 'zh.html', 'components.html']) {
  const html = readFileSync(resolve(root, name), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${name}: IDs must be unique.`);
  for (const [, url] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (url.startsWith('#')) assert(ids.includes(url.slice(1)), `${name}: missing anchor ${url}`);
    else if (!/^(?:[a-z]+:|\/\/)/i.test(url)) assert(existsSync(resolve(root, url.split('#')[0])), `${name}: missing file ${url}`);
  }
  assert(html.includes('width=device-width'));
  if (name !== 'components.html') {
    assert.equal((html.match(/class="project-description"/g) || []).length, 4, 'Project descriptions stay visible without interaction.');
    assert.equal((html.match(/<details\b/g) || []).length, 0);
    assert(!/animation-hint|figure-tabs|diagram-state|data-gallery|project-summary|research-note/.test(html), 'Project previews must not add controls or rewritten summaries.');
    assert(/<a class="diagram diagram-link"[^>]+href="https:\/\/github\.com\/ZHANGTianjian09\/non-gaussian-erm\/blob\/main\/paper\.pdf"/.test(html), 'The paper thumbnail must link directly to the paper.');
  }
}

const assets = readdirSync(resolve(root, 'assets'), {recursive:true}).filter(file => /\.(?:js|mjs|css)$/.test(file));
for (const relative of assets) {
  const path = resolve(root, 'assets', relative);
  const source = readFileSync(path, 'utf8');
  if (/\.(?:js|mjs)$/.test(relative)) {
    const result = spawnSync(process.execPath, ['--check', path], {encoding:'utf8'});
    assert.equal(result.status, 0, `${relative}: ${result.stderr}`);
    for (const [, url] of source.matchAll(/(?:from\s+|new URL\()'([^']+)'/g)) {
      if (url.startsWith('.')) assert(existsSync(resolve(dirname(path), url)), `${relative}: missing module or asset ${url}`);
    }
  } else {
    for (const [, url] of source.matchAll(/@import url\("([^"]+)"\)/g)) assert(existsSync(resolve(dirname(path), url)), `${relative}: missing stylesheet ${url}`);
  }
  if (relative !== 'tokens.css') assert(!/#[\da-f]{3,8}\b/i.test(source), `${relative}: put UI color literals in tokens.css.`);
}

// Guard the new palette's reading contrast and catch drift between shared token users.
const tokenSource = readFileSync(resolve(root, 'assets/tokens.css'), 'utf8');
const tokens = Object.fromEntries([...tokenSource.matchAll(/(--[\w-]+):\s*(#[\da-f]{6});/gi)].map(match => [match[1], match[2]]));
function luminance(hex) {
  const rgb = [1,3,5].map(start => parseInt(hex.slice(start,start+2),16)/255).map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4);
  return rgb[0]*.2126 + rgb[1]*.7152 + rgb[2]*.0722;
}
function contrast(a,b) {
  const values = [luminance(a), luminance(b)].sort((x,y) => y-x);
  return (values[0]+.05)/(values[1]+.05);
}
for (const [fg,bg] of [['--ink','--paper'],['--body','--paper'],['--muted','--surface'],['--accent','--paper'],['--nav-ink','--nav-background'],['--on-accent','--accent']]) {
  assert(contrast(tokens[fg],tokens[bg]) >= 4.5, `${fg} on ${bg} must remain readable.`);
}
const definedTokens = new Set([...tokenSource.matchAll(/(--[\w-]+):/g)].map(match => match[1]));
for (const relative of assets.filter(file => file.endsWith('.css'))) {
  for (const [,name] of readFileSync(resolve(root, 'assets', relative), 'utf8').matchAll(/var\((--[\w-]+)/g)) assert(definedTokens.has(name), `${relative}: undefined token ${name}`);
}
console.log('PASS: diagram models, three-page anchors/assets, all JS modules, CSS imports/tokens and reading contrast.');
