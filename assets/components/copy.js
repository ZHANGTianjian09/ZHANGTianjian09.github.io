import { translator } from './locale.js';

const initialized = new WeakSet();

/** Enhance buttons carrying data-copy and an optional data-copy-status element ID. */
export function initCopyButtons(root = document) {
  const doc = root.ownerDocument || root;
  const t = translator(doc.documentElement.lang);
  root.querySelectorAll('[data-copy]').forEach(button => {
    if (initialized.has(button)) return;
    initialized.add(button);
    const originalLabel = button.textContent;
    let reset;
    button.addEventListener('click', async () => {
      clearTimeout(reset);
      const status = doc.getElementById(button.dataset.copyStatus);
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.textContent = t('Copied ✓','已复制 ✓');
        if (status) status.textContent = t('Copied to clipboard.','已复制到剪贴板。');
        reset = setTimeout(() => {
          button.textContent = originalLabel;
          if (status) status.textContent = '';
        }, 2400);
      } catch {
        button.textContent = button.dataset.copy;
        if (status) status.textContent = t('Copy unavailable. Select the displayed text to copy it.','复制不可用，可以选择已显示的文字进行复制。');
      }
    });
  });
}
