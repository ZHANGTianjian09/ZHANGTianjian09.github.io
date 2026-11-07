import { initComponents } from './components/index.js';

initComponents();

// Explicit language URLs always win; only the bare homepage applies a preference.
if (location.pathname.endsWith('/') && !location.hash) {
  let preferred;
  try { preferred = localStorage.getItem('site-language'); } catch {}
  if (!preferred) preferred = navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
  if (preferred === 'zh' && !document.documentElement.lang.startsWith('zh')) location.replace('zh.html');
}
