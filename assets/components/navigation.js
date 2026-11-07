const instances = new WeakSet();

/** Sticky navigation, mobile disclosure and optional language links. */
export function initNavigation(root = document, gallery = { isOpen: () => false }) {
  const menuButton = root.querySelector('.menu-toggle');
  const nav = root.querySelector('.main-nav');
  if (!menuButton || !nav) return;
  if (instances.has(nav)) return;
  instances.add(nav);
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

  const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = navLinks.map(link => root.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (!sections.length) return;
  const languageLinks = [...root.querySelectorAll('[data-language]')];
  const languageBases = new Map(languageLinks.map(link => [link, link.getAttribute('href').split('#')[0]]));
  let scrollQueued = false;
  let navigationTarget = sections.find(section => section.id === location.hash.slice(1)) || null;
  root.querySelectorAll('.main-nav a, .hero-actions a[href^="#"], .back-top, .brand').forEach(link => {
    link.addEventListener('click', () => {
      navigationTarget = sections.find(section => `#${section.id}` === link.getAttribute('href')) || null;
      requestAnimationFrame(updateLocation);
    });
  });
  addEventListener('wheel', () => { navigationTarget = null; }, {passive:true});
  addEventListener('touchmove', () => { navigationTarget = null; }, {passive:true});
  addEventListener('keydown', event => {
    if (['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key) && !gallery.isOpen()) navigationTarget = null;
  });
  function updateLocation() {
    scrollQueued = false;
    let current = sections[0];
    const marker = root.querySelector('.site-header').getBoundingClientRect().height + 100;
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
    current.querySelectorAll('[data-nav-anchor]').forEach(item => { if (item.getBoundingClientRect().top <= marker) anchor = item.id; });
    // Keep the intended destination stable while a nav click is still scrolling.
    const languageAnchor = navigationTarget?.id || anchor;
    languageLinks.forEach(link => link.href = `${languageBases.get(link)}#${languageAnchor}`);
  }
  addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateLocation); } }, {passive:true});
  addEventListener('resize', updateLocation);
  addEventListener('hashchange', () => {
    navigationTarget = sections.find(section => section.id === location.hash.slice(1)) || null;
    updateLocation();
  });
  languageLinks.forEach(link => link.addEventListener('click', event => {
    try { localStorage.setItem('site-language', link.dataset.language); } catch {}
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const anchor = navigationTarget?.id || link.hash.slice(1);
    location.assign(`${languageBases.get(link)}${anchor ? `#${anchor}` : ''}`);
  }));


  updateLocation();
}
