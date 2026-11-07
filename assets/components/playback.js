/** Finite, visibility-aware playback shared by all project figures. */
export function createPlaybackGroup(root, gallery, t) {
  const doc = root.ownerDocument || root;
  const scope = root.documentElement || root;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
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
      if (state.visible && !state.seen) {
        state.seen = true;
        state.playing = !reduced();
      }
      state.refresh();
    });
  }, { threshold: 0.35 });
  doc.addEventListener('visibilitychange', refreshAll);
  gallery.element.addEventListener('gallerychange', refreshAll);
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
      const button = figure.querySelector('.animation-toggle');
      const state = { figure, index: 0, playing: false, seen: false, visible: false, timer: null, count };
      state.refresh = () => {
        clearTimeout(state.timer);
        button.textContent = reduced() ? t('Next step →','下一步 →') : state.playing ? t('Pause Ⅱ','暂停 Ⅱ') : state.index === count - 1 ? t('Replay ↺','重播 ↺') : t('Play ▷','播放 ▷');
        button.setAttribute('aria-label', `${figure.querySelector('.figure-label').textContent}: ${button.textContent}`);
        if (state.playing && state.visible && !doc.hidden && !gallery.isOpen() && !reduced()) {
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
        state.seen = true;
        render(index);
        state.refresh();
      };
      button.addEventListener('click', () => {
        state.seen = true;
        if (reduced()) state.select((state.index + 1) % count);
        else {
          if (!state.playing && state.index === count - 1) { state.index = 0; render(0); }
          state.playing = !state.playing;
          state.refresh();
        }
      });
      render(0);
      state.refresh();
      controllers.push(state);
      observer.observe(figure);
      return state;
    }
  };
}
