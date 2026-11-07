import { alignPoses, poseSequenceA, poseSequenceB, queensTrace } from './diagram-models.mjs';

const zh = document.documentElement.lang === 'zh-CN';
const t = (en, cn) => zh ? cn : en;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const controllers = [];
const dialog = document.querySelector('.image-dialog');
const figureAssets = {
  erm: [
    ['images/erm-marginal.png', t('Feature marginal distributions', '特征边缘分布')],
    ['images/erm-score.png', t('Prediction score distributions', '预测得分分布')]
  ],
  sampling: [['images/proximal-v2.svg', t('Tempered proximal sampling: original diagram', '幂次调节近端采样：原始图例')]],
  motion: [['images/motion.svg', t('Motion similarity: original diagram', '动作相似度：原始图例')]],
  queens: [['images/nqueens.svg', t('Two solutions to the 4-queens problem', '4 皇后问题的两个合法解')]]
};

function playback(figure, count, render, interval = 1100) {
  const button = figure.querySelector('.animation-toggle');
  const state = { figure, index: 0, playing: false, seen: false, visible: false, timer: null, count };
  state.refresh = () => {
    clearTimeout(state.timer);
    button.textContent = reducedMotion.matches ? t('Next step →', '下一步 →') : state.playing ? t('Pause Ⅱ', '暂停 Ⅱ') : state.index === count - 1 ? t('Replay ↺', '重播 ↺') : t('Play ▷', '播放 ▷');
    button.setAttribute('aria-label', `${figure.querySelector('.figure-label').textContent}: ${button.textContent}`);
    if (state.playing && state.visible && !document.hidden && !dialog.open && !reducedMotion.matches) {
      state.timer = setTimeout(() => {
        if (state.index < count - 1) {
          state.index++;
          render(state.index);
        }
        if (state.index === count - 1) state.playing = false;
        state.refresh();
      }, interval);
    }
  };
  state.select = index => {
    state.index = index;
    state.playing = false;
    state.seen = true;
    render(index);
    state.refresh();
  };
  button.addEventListener('click', () => {
    state.seen = true;
    if (reducedMotion.matches) state.select((state.index + 1) % count);
    else {
      if (!state.playing && state.index === count - 1) {
        state.index = 0;
        render(0);
      }
      state.playing = !state.playing;
      state.refresh();
    }
  });
  render(0);
  state.refresh();
  controllers.push(state);
  return state;
}

function makeErm(figure) {
  const live = figure.querySelector('.diagram-live');
  live.innerHTML = `<div class="figure-tabs" role="group" aria-label="${t('Choose a figure', '选择图表')}"><button type="button" aria-pressed="true">1. ${t('Features', '特征分布')}</button><button type="button" aria-pressed="false">2. ${t('Predictions', '预测分布')}</button></div><div class="diagram-canvas">${figureAssets.erm.map(([src, alt], i) => `<a href="${src}" data-chart="${i}" ${i ? 'hidden' : ''} aria-label="${t('Enlarge', '放大')} ${alt}"><img class="chart-image" src="${src}" alt="${alt}" loading="lazy"></a>`).join('')}</div><p class="diagram-state"></p>`;
  const tabs = [...live.querySelectorAll('.figure-tabs button')];
  const charts = [...live.querySelectorAll('[data-chart]')];
  const state = playback(figure, 2, index => {
    tabs.forEach((tab, i) => tab.setAttribute('aria-pressed', String(i === index)));
    charts.forEach((chart, i) => chart.hidden = i !== index);
    figure.dataset.activeChart = String(index);
    live.querySelector('.diagram-state').textContent = index === 0
      ? t('Matching moments can hide different feature distributions.', '相同的矩信息，仍可能对应不同的特征分布。')
      : t('Distributional differences can remain in prediction scores.', '分布形态的差异，也可能延续到预测得分中。');
  }, 2700);
  tabs.forEach((tab, i) => tab.addEventListener('click', () => state.select(i)));
  charts.forEach((chart, i) => chart.addEventListener('click', event => { event.preventDefault(); openGallery('erm', i); }));
}

function makeSampling(figure) {
  const live = figure.querySelector('.diagram-live');
  const titles = [t('Current state', '当前状态'), t('Implicit proximal step', '隐式近端更新'), t('Gaussian noise', '高斯噪声')];
  const subtitles = [t('Choose state-dependent scaling', '根据当前状态确定缩放'), t('Update the drift', '更新漂移项'), t('Scale noise by the current state', '噪声强度依赖当前状态')];
  live.innerHTML = `<div class="diagram-canvas"><svg viewBox="0 0 400 268" role="img" aria-label="${t('An illustrated sampling update: scaling, drift, then noise', '采样更新示意：状态缩放、漂移更新、加入噪声')}">${titles.map((title, i) => `<g class="flow-stage" data-stage="${i}"><rect class="flow-node" x="30" y="${i * 72 + 3}" width="340" height="54" rx="6"/><text class="flow-number" x="48" y="${i * 72 + 35}">0${i+1}</text><text class="flow-title" x="83" y="${i * 72 + 26}">${title}${i === 0 ? ' xₖ' : ''}</text><text class="flow-subtitle" x="83" y="${i * 72 + 44}">${subtitles[i]}</text></g>`).join('')}<path class="flow-connector" d="M200 57v17m-4-5 4 5 4-5 M200 129v17m-4-5 4 5 4-5 M200 201v20m-4-5 4 5 4-5"/><circle class="flow-dot" cx="200" cy="65" r="3"/><g class="flow-stage" data-stage="3"><rect class="flow-node" x="114" y="228" width="172" height="31" rx="15"/><text class="flow-title" x="200" y="248" text-anchor="middle">${t('Next state', '下一状态')} xₖ₊₁</text></g></svg></div><p class="diagram-state"></p>`;
  const steps = [t('Start from xₖ and choose the scaling.', '从 xₖ 出发，确定状态相关的缩放。'), t('Take the implicit drift update.', '通过隐式近端步骤更新漂移。'), t('Add state-scaled Gaussian noise.', '加入强度与状态相关的高斯噪声。'), t('One update is complete; continue from xₖ₊₁.', '完成一次更新，再从 xₖ₊₁ 继续。')];
  playback(figure, 4, index => {
    live.querySelectorAll('[data-stage]').forEach((node, i) => node.classList.toggle('is-current', i === index));
    live.querySelector('.flow-dot').setAttribute('cy', [65, 137, 211, 221][index]);
    live.querySelector('.flow-dot').style.opacity = index === 3 ? '0' : '1';
    live.querySelector('.diagram-state').textContent = `${index + 1} / 4 · ${steps[index]}`;
  }, 1500);
}

function makeMotion(figure) {
  const live = figure.querySelector('.diagram-live');
  const path = alignPoses(poseSequenceA, poseSequenceB);
  const x = (index, length) => 50 + index * 300 / (length - 1);
  const skeleton = (video, offset, color) => `<g transform="translate(${offset},15)" class="pose-body" stroke="${color}"><circle cx="0" cy="16" r="10"/><path d="M0 29V76M0 76L-19 108M0 76L19 108"/><g transform="translate(0,39)"><g class="pose-arm" data-video="${video}" data-side="left"><path d="M0 0L-21 25L-34 17"/></g><g class="pose-arm" data-video="${video}" data-side="right"><path d="M0 0L21 25L34 17"/></g></g></g>`;
  live.innerHTML = `<div class="diagram-canvas"><svg viewBox="0 0 400 268" role="img" aria-label="${t('Example joint poses aligned across two differently paced sequences using dynamic time warping', '通过动态时间规整，对齐两个节奏不同的示例关节姿态序列')}">${skeleton('A',100,'#2a708e')}${skeleton('B',300,'#a64f2a')}<text x="100" y="145" text-anchor="middle" class="flow-subtitle" data-frame-label="A"></text><text x="300" y="145" text-anchor="middle" class="flow-subtitle" data-frame-label="B"></text><text x="22" y="178" class="flow-subtitle">A</text><text x="22" y="215" class="flow-subtitle">B</text><path d="M50 174H350M50 211H350" stroke="#e1e6da"/><g class="alignment-lines">${path.map(([a,b]) => `<path class="timeline-path" style="opacity:.12" d="M${x(a,poseSequenceA.length)} 174L${x(b,poseSequenceB.length)} 211"/>`).join('')}</g><path class="timeline-path" data-active-match=""/>${poseSequenceA.map((_,i) => `<circle class="frame-dot" data-sequence="A" data-frame="${i}" cx="${x(i,poseSequenceA.length)}" cy="174" r="5"/>`).join('')}${poseSequenceB.map((_,i) => `<circle class="frame-dot" data-sequence="B" data-frame="${i}" cx="${x(i,poseSequenceB.length)}" cy="211" r="5"/>`).join('')}<text class="flow-subtitle" x="200" y="253" text-anchor="middle">AlphaPose → MotionBERT → DTW</text></svg></div><p class="diagram-state"></p>`;
  playback(figure, path.length + 1, index => {
    const [a,b] = index ? path[index-1] : [2,1];
    live.querySelectorAll('.pose-arm').forEach(arm => {
      const angle = (arm.dataset.video === 'A' ? poseSequenceA[a] : poseSequenceB[b]) * 76;
      arm.style.transform = `rotate(${arm.dataset.side === 'left' ? angle : -angle}deg)`;
    });
    live.querySelectorAll('.frame-dot').forEach(dot => dot.classList.toggle('active', Number(dot.dataset.frame) === (dot.dataset.sequence === 'A' ? a : b)));
    live.querySelector('[data-frame-label="A"]').textContent = `A · ${t('Frame', '帧')} ${a+1}`;
    live.querySelector('[data-frame-label="B"]').textContent = `B · ${t('Frame', '帧')} ${b+1}`;
    live.querySelector('.alignment-lines').style.opacity = index ? '1' : '0';
    live.querySelector('[data-active-match]').setAttribute('d', index ? `M${x(a,poseSequenceA.length)} 174L${x(b,poseSequenceB.length)} 211` : '');
    live.querySelector('.diagram-state').textContent = index === 0 ? t('Same action, different timing. Match poses, not timestamps.', '动作相同，节奏不同：对齐姿态，而非时间戳。') : `${t('DTW match', 'DTW 配对')} ${index} / ${path.length} · A${a+1} ↔ B${b+1}`;
  }, 750);
}

function makeQueens(figure) {
  const live = figure.querySelector('.diagram-live');
  const frames = queensTrace(4);
  const queen = '<path d="M12 12L18 31H42L48 12L39 22L30 9L21 22Z M21 34H39L41 39L36 43L40 57H20L24 43L19 39Z M18 59H42L45 65H15Z"/><circle cx="12" cy="10" r="3"/><circle cx="30" cy="6" r="3"/><circle cx="48" cy="10" r="3"/>';
  live.innerHTML = `<div class="diagram-canvas"><svg viewBox="0 0 400 238" role="img" aria-label="${t('A real bit-mask backtracking search for a valid 4-queens placement', '位掩码回溯搜索，寻找一个合法的 4 皇后摆法')}">${Array.from({length:16},(_,i) => {const row = Math.floor(i/4), col = i%4;return `<rect class="board-square ${(row+col)%2 ? 'dark' : ''}" data-row="${row}" data-col="${col}" x="${col*50+4}" y="${row*50+10}" width="50" height="50"/><g class="queen-piece" data-queen="${row}-${col}" transform="translate(${col*50+13},${row*50+15}) scale(.55)" hidden>${queen}</g>`;}).join('')}<text class="flow-subtitle" x="244" y="51">${t('Available columns', '可选列')}</text>${['A','B','C','D'].map((label,i)=>`<text class="flow-subtitle" x="${252+i*34}" y="77" text-anchor="middle">${label}</text><rect class="mask-cell" data-mask="${i}" x="${238+i*34}" y="86" width="29" height="35" rx="4"/><text class="mask-text" data-bit="${i}" x="${252+i*34}" y="109" text-anchor="middle">1</text>`).join('')}<text class="flow-subtitle" x="244" y="150">${t('1 = available', '1 = 可选')}</text><text class="flow-subtitle" x="244" y="168">${t('0 = ruled out', '0 = 排除')}</text><text class="flow-title" x="244" y="197" data-queen-count=""></text>${['A','B','C','D'].map((label,i)=>`<text class="flow-subtitle" x="${29+i*50}" y="229" text-anchor="middle">${label}</text>`).join('')}</svg></div><div class="diagram-key"><span>${t('Available square', '可选位置')}</span><span>${t('No legal move', '无合法位置')}</span></div><p class="diagram-state"></p>`;
  playback(figure, frames.length, index => {
    const frame = frames[index];
    live.querySelectorAll('[data-row]').forEach(cell => {
      const current = Number(cell.dataset.row) === frame.row;
      cell.classList.toggle('available', current && Boolean(frame.available & (1 << Number(cell.dataset.col))));
      cell.classList.toggle('blocked', current && frame.kind === 'dead-end');
    });
    live.querySelectorAll('[data-queen]').forEach(piece => {
      const [row,col] = piece.dataset.queen.split('-').map(Number);
      piece.toggleAttribute('hidden', frame.positions[row] !== col);
    });
    live.querySelectorAll('[data-mask]').forEach(cell => cell.classList.toggle('is-available', Boolean(frame.available & (1 << Number(cell.dataset.mask)))));
    live.querySelectorAll('[data-bit]').forEach(bit => bit.textContent = frame.available & (1 << Number(bit.dataset.bit)) ? '1' : '0');
    live.querySelector('[data-queen-count]').textContent = `${frame.positions.length} / 4 ${t('queens', '个皇后')}`;
    const descriptions = {
      search:t('Place a queen; update the allowed columns.', '放置皇后，更新下一行可选列。'),
      'dead-end':t('No legal square. Go back one row.', '无合法位置，退回上一行。'),
      backtrack:t('Remove a queen and try the next branch.', '撤回皇后，尝试下一个分支。'),
      solved:t('A solution: no shared rows, columns or diagonals.', '找到合法解：同行、同列、同斜线均无冲突。')
    };
    live.querySelector('.diagram-state').textContent = `${index+1} / ${frames.length} · ${descriptions[frame.kind]}`;
  }, 850);
}

document.querySelectorAll('[data-diagram]').forEach(figure => ({erm:makeErm,sampling:makeSampling,motion:makeMotion,queens:makeQueens}[figure.dataset.diagram])(figure));

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const state = controllers.find(item => item.figure === entry.target);
    state.visible = entry.isIntersecting;
    if (state.visible && !state.seen) {
      state.seen = true;
      state.playing = !reducedMotion.matches;
    }
    state.refresh();
  });
}, {threshold:0.35});
controllers.forEach(state => observer.observe(state.figure));
document.addEventListener('visibilitychange', () => controllers.forEach(state => state.refresh()));
reducedMotion.addEventListener('change', () => controllers.forEach(state => { state.playing = false; state.refresh(); }));

let gallery = [], galleryIndex = 0, previousOverflow = '';
function renderGallery() {
  const [src, alt] = gallery[galleryIndex];
  dialog.querySelector('.dialog-image').src = src;
  dialog.querySelector('.dialog-image').alt = alt;
  dialog.querySelector('#dialog-title').textContent = alt;
  dialog.querySelector('.dialog-original').href = src;
  dialog.querySelector('.dialog-count').textContent = `${galleryIndex+1} / ${gallery.length}`;
  dialog.querySelector('.dialog-nav').hidden = gallery.length === 1;
  dialog.querySelector('[data-direction="-1"]').disabled = galleryIndex === 0;
  dialog.querySelector('[data-direction="1"]').disabled = galleryIndex === gallery.length-1;
}
function openGallery(key, index = 0) {
  gallery = figureAssets[key];
  galleryIndex = index;
  renderGallery();
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  dialog.showModal();
  controllers.forEach(state => state.refresh());
}
document.querySelectorAll('[data-gallery]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  openGallery(link.dataset.gallery, Number(link.closest('[data-diagram]').dataset.activeChart || 0));
}));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => { document.body.style.overflow = previousOverflow; controllers.forEach(state => state.refresh()); });
function moveGallery(direction) {
  galleryIndex = Math.max(0, Math.min(gallery.length-1, galleryIndex+direction));
  renderGallery();
}
dialog.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => moveGallery(Number(button.dataset.direction))));
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); moveGallery(event.key === 'ArrowRight' ? 1 : -1); }
});

const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
function closeMenu(restoreFocus = false) {
  nav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  if (restoreFocus) menuButton.focus();
  requestAnimationFrame(updateLocation);
}
menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
  requestAnimationFrame(updateLocation);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMenu(true); });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
matchMedia('(min-width: 861px)').addEventListener('change', () => closeMenu());

const navLinks = [...nav.querySelectorAll('a')];
const sections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
const languageLinks = [...document.querySelectorAll('[data-language]')];
let scrollQueued = false;
let navigationTarget = sections.find(section => section.id === location.hash.slice(1)) || null;
document.querySelectorAll('.main-nav a, .hero-actions a[href^="#"], .back-top, .brand').forEach(link => {
  link.addEventListener('click', () => {
    navigationTarget = sections.find(section => `#${section.id}` === link.getAttribute('href')) || null;
    requestAnimationFrame(updateLocation);
  });
});
addEventListener('wheel', () => { navigationTarget = null; }, {passive:true});
addEventListener('touchmove', () => { navigationTarget = null; }, {passive:true});
addEventListener('keydown', event => {
  if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key) && !dialog.open) navigationTarget = null;
});
function updateLocation() {
  scrollQueued = false;
  let current = sections[0];
  const marker = document.querySelector('.site-header').getBoundingClientRect().height + 100;
  let closestTop = -Infinity;
  for (const section of sections) {
    const top = section.getBoundingClientRect().top;
    if (top <= marker && top > closestTop + 2) { current = section; closestTop = top; }
  }
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5) current = sections.at(-1);
  if (navigationTarget) {
    const bounds = navigationTarget.getBoundingClientRect();
    if (bounds.top < innerHeight - 60 && bounds.bottom > 100) current = navigationTarget;
  }
  navLinks.forEach(link => {
    if (link.hash === `#${current.id}`) link.setAttribute('aria-current','location');
    else link.removeAttribute('aria-current');
  });
  let anchor = current.id;
  if (anchor === 'projects') document.querySelectorAll('.project').forEach(project => { if (project.getBoundingClientRect().top <= marker) anchor = project.id; });
  languageLinks.forEach(link => link.href = `${link.dataset.language === 'zh' ? 'zh.html' : 'index.html'}#${anchor}`);
}
addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateLocation); } }, {passive:true});
addEventListener('resize', updateLocation);
languageLinks.forEach(link => link.addEventListener('click', () => { try { localStorage.setItem('site-language', link.dataset.language); } catch {} }));

const copyButton = document.querySelector('.copy-email');
let copyReset;
copyButton.addEventListener('click', async () => {
  clearTimeout(copyReset);
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText('tianjianzhang1@link.cuhk.edu.cn');
    copyButton.textContent = t('Copied ✓', '已复制 ✓');
    status.textContent = t('Email address copied.', '邮箱地址已复制。');
    copyReset = setTimeout(() => { copyButton.textContent = t('Copy address', '复制邮箱'); status.textContent = ''; }, 2400);
  } catch {
    copyButton.textContent = 'tianjianzhang1@link.cuhk.edu.cn';
    status.textContent = t('Copy unavailable. The email address is shown beside the Email link.', '复制不可用，邮箱地址已显示在电子邮件链接旁。');
  }
});

document.documentElement.classList.add('js');
updateLocation();
// Explicit language URLs always win. Only the bare homepage uses the saved/browser preference.
if (location.pathname.endsWith('/') && !location.hash) {
  let preferred;
  try { preferred = localStorage.getItem('site-language'); } catch {}
  if (!preferred) preferred = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  if (preferred === 'zh' && !zh) location.replace('zh.html');
}
