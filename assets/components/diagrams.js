import { alignPoses, poseSequenceA, poseSequenceB, queensTrace } from '../diagram-models.mjs';
import { translator } from './locale.js';

const instances = new WeakMap();

/** Small, passive project previews. Native paper links never become playback controls. */
export function initDiagrams(root = document) {
  if (instances.has(root)) return instances.get(root);
  const doc = root.ownerDocument || root;
  const scope = root.documentElement || root;
  const t = translator(doc.documentElement.lang);
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let manualReduce = false;
  const updateMotion = () => scope.classList.toggle('reduce-motion', media.matches || manualReduce);
  media.addEventListener('change', updateMotion);
  updateMotion();

  function erm() {
    const source = new URL('../../images/erm-marginal.png', import.meta.url).href;
    // Both layers are the same original plot; hovering reveals it without changing data.
    return `<img class="preview-chart" src="${source}" alt="" loading="lazy"><img class="preview-chart preview-chart-trace" src="${source}" alt="" loading="lazy">`;
  }

  function sampling() {
    return `<svg viewBox="0 0 240 160"><path class="preview-guide" d="M28 101L108 78L218 69"/><path class="sampling-path" d="M28 101L108 78L125 66L145 87L164 63L187 80L218 69"/><circle class="preview-node" cx="28" cy="101" r="5"/><circle class="preview-node" cx="218" cy="69" r="5"/><circle class="sampling-dot" r="4"/><text class="preview-symbol" x="28" y="126" text-anchor="middle">xₖ</text><text class="preview-symbol" x="218" y="94" text-anchor="middle">xₖ₊₁</text><text class="preview-label" x="73" y="67" text-anchor="middle">${t('Drift','漂移')}</text><text class="preview-label" x="170" y="47" text-anchor="middle">${t('Noise','噪声')}</text></svg>`;
  }

  function motion() {
    const person = (x, series) => `<g class="motion-person motion-${series}" transform="translate(${x},12)"><circle cx="0" cy="12" r="9"/><path d="M0 23V65M0 65L-16 91M0 65L16 91"/><g transform="translate(0,34)"><g class="motion-arm motion-arm-left"><path d="M0 0L-17 19L-27 11"/></g><g class="motion-arm motion-arm-right"><path d="M0 0L17 19L27 11"/></g></g></g>`;
    const x = (index, length) => 36 + index * 180 / (length - 1);
    const matches = alignPoses(poseSequenceA, poseSequenceB).map(([a,b]) => `<path pathLength="1" d="M${x(a,poseSequenceA.length)} 126L${x(b,poseSequenceB.length)} 145"/>`).join('');
    const dots = (poses, y, series) => poses.map((_,i) => `<circle class="motion-dot motion-dot-${series}" cx="${x(i,poses.length)}" cy="${y}" r="2.6"/>`).join('');
    return `<svg viewBox="0 0 240 160">${person(65,'a')}${person(175,'b')}<path class="preview-guide" d="M36 126H216M36 145H216"/><g class="motion-alignment">${matches}</g>${dots(poseSequenceA,126,'a')}${dots(poseSequenceB,145,'b')}<text class="preview-label" x="16" y="129">A</text><text class="preview-label" x="16" y="148">B</text></svg>`;
  }

  function queens() {
    const solution = queensTrace(4).at(-1).positions;
    const board = Array.from({length:16},(_,i) => {
      const row = Math.floor(i / 4), col = i % 4;
      return `<rect class="preview-square ${(row + col) % 2 ? 'is-dark' : ''}" x="${52 + col * 34}" y="${12 + row * 34}" width="34" height="34"/>`;
    }).join('');
    const pieces = solution.map((col,row) => `<g transform="translate(${57 + col * 34},${15 + row * 34}) scale(.39)"><g class="preview-queen queen-${row}"><path d="M12 12L18 31H42L48 12L39 22L30 9L21 22Z M21 34H39L41 39L36 43L40 57H20L24 43L19 39Z M18 59H42L45 65H15Z"/><circle cx="12" cy="10" r="3"/><circle cx="30" cy="6" r="3"/><circle cx="48" cy="10" r="3"/></g></g>`).join('');
    return `<svg viewBox="0 0 240 160">${board}${pieces}</svg>`;
  }

  root.querySelectorAll('[data-diagram]').forEach(figure => {
    const render = { erm, sampling, motion, queens }[figure.dataset.diagram];
    const live = figure.querySelector('.diagram-live');
    if (!render || !live) return;
    live.innerHTML = render();
    figure.classList.add('is-enhanced');
  });
  const api = {
    get reducedMotion() { return media.matches || manualReduce; },
    setReducedMotion(enabled) {
      manualReduce = Boolean(enabled);
      updateMotion();
      return media.matches || manualReduce;
    }
  };
  instances.set(root, api);
  return api;
}
