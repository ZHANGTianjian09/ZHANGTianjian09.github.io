import { initDiagrams } from './components/diagrams.js';

const diagrams = initDiagrams();
const stage = document.querySelector('#demo-stage');
const tabs = [...document.querySelectorAll('[data-mode][role="tab"]')];
const hoverMedia = matchMedia('(any-hover: hover)');
const sideBySideMedia = matchMedia('(min-width: 721px)');
const modes = {
  a: { title:'A / 直接全显', description:'全部 bullet 直接放在图片旁。悬停只播放小图，文字与行高不变化。', delay:0 },
  b: { title:'B / 图文同收', description:'收起时同时缩小图片，只留第一条原文；悬停后图文一起展开，整行才真正变高。', delay:140 },
  c: { title:'C / 按需展开', description:'先把能放下的完整 bullet 放在图片旁。只有超出图片高度、折叠能明显减少行高时，才显示展开。', delay:140 }
};
let mode = 'a';

const cards = [...document.querySelectorAll('.demo-card')].map(element => {
  const button = element.querySelector('.disclosure-toggle');
  const content = element.querySelector('.demo-more');
  const lead = element.querySelector('.demo-bullets');
  const rest = content.querySelector('.demo-bullets');
  const copy = element.querySelector('.demo-copy');
  const figure = element.querySelector('.diagram');
  const items = [...element.querySelectorAll('.demo-bullets li')];
  const title = element.querySelector('h3').textContent.replace('↗','').trim();
  const state = { element, button, content, collapsible:false, open:false, pinned:false, hovering:false, dismissed:false, revealTimer:0, closeTimer:0 };

  state.clearTimers = () => {
    clearTimeout(state.revealTimer);
    clearTimeout(state.closeTimer);
  };
  state.setOpen = open => {
    open = open && state.collapsible;
    const count = rest.children.length;
    state.open = open;
    element.classList.toggle('is-open', open);
    content.setAttribute('aria-hidden', String(!open));
    content.inert = !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', `${open ? '收起' : '展开'}其余 ${count} 条：${title}`);
    button.querySelector('.disclosure-label').textContent = open ? '收起' : `展开其余 ${count} 条`;
  };
  const showCount = count => {
    // Move the original nodes; never paraphrase, duplicate, or truncate a bullet.
    lead.replaceChildren(...items.slice(0,count));
    rest.replaceChildren(...items.slice(count));
    state.collapsible = count < items.length;
    button.hidden = !state.collapsible;
    element.dataset.visibleCount = String(count);
  };
  state.configure = () => {
    state.reset();
    showCount(items.length);
    if (mode === 'a' || (mode === 'c' && !sideBySideMedia.matches)) return;
    const fullCopyHeight = copy.getBoundingClientRect().height;
    const figureHeight = figure.getBoundingClientRect().height;
    if (mode === 'b') showCount(1);
    else if (fullCopyHeight > figureHeight + 24) {
      let visible = 1;
      for (let count = 1; count < items.length; count++) {
        showCount(count);
        if (copy.getBoundingClientRect().height <= figureHeight + .5) visible = count;
      }
      showCount(visible);
      // An expander that only leaves blank space is worse than showing the text.
      const closedHeight = Math.max(copy.getBoundingClientRect().height,figureHeight);
      if (fullCopyHeight - closedHeight < 32) showCount(items.length);
    }
    state.setOpen(false);
  };
  state.reset = () => {
    state.clearTimers();
    state.hovering = state.pinned = state.dismissed = false;
    element.classList.remove('is-playing');
    state.setOpen(false);
  };

  element.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch' || !hoverMedia.matches) return;
    state.clearTimers();
    state.hovering = true;
    state.dismissed = false;
    element.classList.add('is-playing');
    if (state.open || !state.collapsible) return;
    if (!modes[mode].delay) state.setOpen(true);
    else state.revealTimer = setTimeout(() => {
      if (state.hovering && !state.dismissed) state.setOpen(true);
    }, modes[mode].delay);
  });

  element.addEventListener('pointerleave', event => {
    if (event.pointerType === 'touch') return;
    clearTimeout(state.revealTimer);
    state.hovering = false;
    state.dismissed = false;
    // A short grace period lets the pointer cross whitespace without a flicker.
    state.closeTimer = setTimeout(() => {
      if (state.hovering || element.contains(document.activeElement)) return;
      element.classList.remove('is-playing');
      if (!state.pinned) state.setOpen(false);
    }, 220);
  });

  element.addEventListener('focusin', event => {
    if (!event.target.matches(':focus-visible')) return;
    state.clearTimers();
    element.classList.add('is-playing');
    // The native disclosure button keeps its ordinary Enter / Space behavior.
    if (event.target !== button) state.setOpen(true);
  });
  element.addEventListener('focusout', () => {
    queueMicrotask(() => {
      if (element.contains(document.activeElement) || state.hovering) return;
      element.classList.remove('is-playing');
      if (!state.pinned) state.setOpen(false);
    });
  });

  button.addEventListener('click', () => {
    state.clearTimers();
    const open = !state.open;
    state.pinned = open;
    state.dismissed = !open;
    state.setOpen(open);
    element.classList.toggle('is-playing', open);
  });
  element.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    state.clearTimers();
    state.pinned = false;
    state.dismissed = true;
    state.setOpen(false);
    element.classList.remove('is-playing');
  });
  return state;
});

function chooseMode(next, updateHash = true) {
  mode = Object.hasOwn(modes,next) ? next : 'a';
  stage.dataset.mode = mode;
  stage.setAttribute('aria-labelledby', `option-${mode}`);
  document.querySelector('#mode-title').textContent = modes[mode].title;
  document.querySelector('#mode-description').textContent = modes[mode].description;
  document.querySelector('#mode-footnote').textContent = mode === 'a'
    ? '论文标题和缩略图直接打开论文。全部项目原文均可直接阅读。'
    : mode === 'b'
      ? '触屏或键盘可用「展开」查看全文；论文链接仍直接打开论文。'
      : '窄屏上下排布时直接展示全文；并排时按实际空间判断是否折叠。论文链接保持不变。';
  configureCards();
  tabs.forEach(tab => {
    const selected = tab.dataset.mode === mode;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  if (updateHash) history.replaceState(null,'',`#${mode}`);
}

function configureCards() {
  stage.classList.add('is-measuring');
  cards.forEach(card => card.configure());
  // Commit the measurements before restoring transitions.
  stage.getBoundingClientRect();
  stage.classList.remove('is-measuring');
}

tabs.forEach((tab,index) => {
  tab.addEventListener('click', () => chooseMode(tab.dataset.mode));
  tab.addEventListener('keydown', event => {
    const offsets = { ArrowLeft:-1, ArrowRight:1, Home:-index, End:tabs.length - 1 - index };
    if (!Object.hasOwn(offsets,event.key)) return;
    event.preventDefault();
    const target = tabs[(index + offsets[event.key] + tabs.length) % tabs.length];
    target.focus();
    chooseMode(target.dataset.mode);
  });
});

document.querySelector('#reset-demo').addEventListener('click', () => cards.forEach(card => card.reset()));
window.addEventListener('hashchange', () => chooseMode(location.hash.slice(1),false));
hoverMedia.addEventListener('change', () => cards.forEach(card => card.reset()));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cards.forEach(card => {
    card.clearTimers();
    card.element.classList.remove('is-playing');
  });
});

const motionButton = document.querySelector('#motion-preference');
function showMotionPreference() {
  motionButton.setAttribute('aria-pressed', String(diagrams.reducedMotion));
  motionButton.textContent = diagrams.reducedMotion ? '已减少动态效果' : '减少动态效果';
}
motionButton.addEventListener('click', () => {
  diagrams.setReducedMotion(!diagrams.reducedMotion);
  showMotionPreference();
});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', showMotionPreference);

chooseMode(location.hash.slice(1),false);
showMotionPreference();
document.documentElement.classList.add('demo-ready');
configureCards();
let lastWidth = stage.getBoundingClientRect().width;
let resizeFrame = 0;
const resizeObserver = new ResizeObserver(entries => {
  const width = entries[0].target.getBoundingClientRect().width;
  if (Math.abs(width - lastWidth) < 1) return;
  lastWidth = width;
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(configureCards);
});
resizeObserver.observe(stage);
