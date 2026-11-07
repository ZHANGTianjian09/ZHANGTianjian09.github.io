import { initComponents } from './components/index.js';

// Source examples are read before enhancement, so they remain accurate and copyable.
document.querySelectorAll('[data-code-for]').forEach(code => {
  const example = document.getElementById(code.dataset.codeFor);
  if (example) code.textContent = example.outerHTML;
});
const tokens = getComputedStyle(document.documentElement);
document.querySelectorAll('[data-token]').forEach(swatch => {
  swatch.querySelector('.token-value').textContent = tokens.getPropertyValue(swatch.dataset.token).trim();
});

const { diagrams } = initComponents();
const motionButton = document.querySelector('#motion-preference');
function updateMotionButton() {
  motionButton.setAttribute('aria-pressed', String(diagrams.reducedMotion));
  motionButton.textContent = diagrams.reducedMotion ? '逐步模式已开启' : '开启逐步模式';
}
motionButton.addEventListener('click', () => {
  diagrams.setReducedMotion(!diagrams.reducedMotion);
  updateMotionButton();
});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', updateMotionButton);
updateMotionButton();

document.querySelectorAll('[data-toggle-details]').forEach(button => {
  const details = document.getElementById(button.dataset.toggleDetails);
  button.addEventListener('click', () => {
    details.open = !details.open;
    details.scrollIntoView({ behavior:diagrams.reducedMotion ? 'instant' : 'smooth', block:'center' });
  });
  details.addEventListener('toggle', () => {
    button.setAttribute('aria-expanded', String(details.open));
    button.textContent = details.open ? '收起项目详情' : '展开项目详情';
  });
});
