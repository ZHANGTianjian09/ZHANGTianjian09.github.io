import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
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

for (const name of ['index.html', 'zh.html']) {
  const html = readFileSync(resolve(root, name), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${name}: IDs must be unique.`);
  for (const [, url] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (url.startsWith('#')) assert(ids.includes(url.slice(1)), `${name}: missing anchor ${url}`);
    else if (!/^(?:[a-z]+:|\/\/)/i.test(url)) assert(existsSync(resolve(root, url.split('#')[0])), `${name}: missing file ${url}`);
  }
  assert(html.includes('width=device-width'));
  assert.equal((html.match(/<details\b/g) || []).length, 4);
}
console.log('PASS: legal queen placements and masks, real backtracking, monotone DTW alignment, bilingual anchors and local assets.');
