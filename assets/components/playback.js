let instructionId = 0;

/** Hover-led, finite playback; touch, keyboard and reduced-motion fallbacks. */
export function createPlaybackGroup(root, gallery, t) {
  const doc = root.ownerDocument || root;
  const scope = root.documentElement || root;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const hoverMedia = matchMedia('(any-hover: hover)');
  const controllers = [];
  let manualReduce = false;
  const reduced = () => media.matches || manualReduce;

  function refreshAll() {
    scope.classList.toggle('reduce-motion', reduced());
    controllers.forEach(state => state.refresh());
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const state = controllers.find(item => item.figure === entry.target);
      state.visible = entry.isIntersecting;
      state.refresh();
    });
  }, { threshold: 0.35 });
  doc.addEventListener('visibilitychange', refreshAll);
  gallery.element.addEventListener('gallerychange', refreshAll);
  hoverMedia.addEventListener('change', refreshAll);
  media.addEventListener('change', () => {
    controllers.forEach(state => { state.playing = false; });
    refreshAll();
  });

  return {
    controllers,
    get reducedMotion() { return reduced(); },
    setReducedMotion(enabled) {
      manualReduce = Boolean(enabled);
      controllers.forEach(state => { state.playing = false; });
      refreshAll();
      return reduced();
    },
    create(figure, count, render, interval = 1100) {
      const hint = figure.querySelector('.animation-hint');
      const help = doc.createElement('span');
      help.id = `animation-help-${++instructionId}`;
      help.className = 'visually-hidden';
      figure.append(help);
      figure.tabIndex = 0;
      const describedBy = figure.getAttribute('aria-describedby');
      figure.setAttribute('aria-describedby', [describedBy, help.id].filter(Boolean).join(' '));
      figure.setAttribute('aria-keyshortcuts', 'Enter Space');
      const state = { figure, index: 0, playing: false, visible: false, hovered: false, keyboardWithin: false, source: null, pointerType: null, timer: null, count };

      state.refresh = () => {
        clearTimeout(state.timer);
        const running = state.playing && state.visible && !doc.hidden && !gallery.isOpen() && !reduced();
        const complete = state.index === count - 1;
        const touch = state.source === 'touch' || !hoverMedia.matches;
        figure.dataset.playback = reduced() ? 'reduced' : running ? 'playing' : complete ? 'complete' : state.index ? 'paused' : 'idle';
        if (reduced()) hint.textContent = touch ? t('Tap: next step','轻触查看下一步') : t('Click: next step','点击查看下一步');
        else if (state.source === 'keyboard' && state.keyboardWithin) hint.textContent = running ? t('Space: pause','空格暂停') : complete ? t('Enter: replay','回车重播') : t('Enter: play','回车播放');
        else if (running) hint.textContent = touch ? t('Tap to pause','轻触暂停') : t('Playing','演示中');
        else if (complete) hint.textContent = touch ? t('Tap to replay','轻触重播') : t('Hover to replay','悬停重播');
        else if (state.index) hint.textContent = touch ? t('Tap to continue','轻触继续') : t('Hover to continue','悬停继续');
        else hint.textContent = touch ? t('Tap to animate','轻触播放') : t('Hover to animate','悬停播放');
        help.textContent = reduced()
          ? t('Step-by-step illustration. Click, tap, or press Enter or Space to advance.','逐步图例。点击、轻触，或按回车、空格查看下一步。')
          : t('Hover to play; move away to pause. On touch screens, tap to play or pause. With keyboard focus, Enter or Space toggles playback. Re-enter after completion to replay.','鼠标移入播放、移出暂停。触屏轻触可播放或暂停。键盘聚焦后，回车或空格可切换播放状态。完成后再次移入可重播。');
        if (running) {
          state.timer = setTimeout(() => {
            if (state.index < count - 1) render(++state.index);
            if (state.index === count - 1) state.playing = false;
            state.refresh();
          }, interval);
        }
      };
      state.select = index => {
        state.index = index;
        state.playing = false;
        render(index);
        state.refresh();
      };

      function start(source) {
        state.source = source;
        if (!reduced()) {
          if (state.index === count - 1) { state.index = 0; render(0); }
          state.playing = true;
        }
        state.refresh();
      }
      function activate(source) {
        state.source = source;
        if (reduced()) state.select((state.index + 1) % count);
        else if (state.playing) { state.playing = false; state.refresh(); }
        else start(source);
      }
      figure.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        state.hovered = true;
        start('hover');
      });
      figure.addEventListener('pointerleave', event => {
        if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        state.hovered = false;
        if (state.keyboardWithin) state.source = 'keyboard';
        else state.playing = false;
        state.refresh();
      });
      figure.addEventListener('pointerdown', event => { state.pointerType = event.pointerType; });
      figure.addEventListener('click', event => {
        // Chart tabs, zoom links and any future nested controls retain their own actions.
        if (event.target.closest('a, button, summary, input, select, textarea, label, [role="button"]')) return;
        const touch = (event.pointerType || state.pointerType) === 'touch';
        if (reduced() || touch || event.detail === 0) activate(touch ? 'touch' : 'keyboard');
      });
      figure.addEventListener('focusin', event => {
        if (event.target !== figure || !figure.matches(':focus-visible')) return;
        state.keyboardWithin = true;
        start('keyboard');
      });
      figure.addEventListener('focusout', event => {
        if (figure.contains(event.relatedTarget)) return;
        state.keyboardWithin = false;
        if (state.hovered) state.source = 'hover';
        else state.playing = false;
        state.refresh();
      });
      figure.addEventListener('keydown', event => {
        if (event.target !== figure || !['Enter',' '].includes(event.key)) return;
        event.preventDefault();
        if (!event.repeat) activate('keyboard');
      });
      render(0);
      state.refresh();
      controllers.push(state);
      observer.observe(figure);
      return state;
    }
  };
}
