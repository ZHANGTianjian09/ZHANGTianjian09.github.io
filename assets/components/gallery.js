import { translator } from './locale.js';

const instances = new WeakMap();

/** One accessible image dialog per document. Items are [imageURL, description] pairs. */
export function initImageGallery(root = document) {
  const doc = root.ownerDocument || root;
  if (instances.has(doc)) return instances.get(doc);
  const t = translator(doc.documentElement.lang);
  const dialog = doc.createElement('dialog');
  dialog.className = 'image-dialog';
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  dialog.innerHTML = `<div class="dialog-toolbar"><h2 id="dialog-title">${t('Project figures','项目图表')}</h2><button class="dialog-close" type="button" autofocus>${t('Close','关闭')} ×</button></div><img class="dialog-image" alt=""><div class="dialog-nav"><button type="button" data-direction="-1">← ${t('Previous','上一张')}</button><span class="dialog-count"></span><button type="button" data-direction="1">${t('Next','下一张')} →</button></div><p class="dialog-source"><a class="dialog-original" target="_blank" rel="noopener">${t('Open original image','查看原始图片')} ↗</a></p>`;
  doc.body.append(dialog);
  let items = [], index = 0, previousOverflow = '';

  function render() {
    const [src, description] = items[index];
    dialog.querySelector('.dialog-image').src = src;
    dialog.querySelector('.dialog-image').alt = description;
    dialog.querySelector('#dialog-title').textContent = description;
    dialog.querySelector('.dialog-original').href = src;
    dialog.querySelector('.dialog-count').textContent = `${index + 1} / ${items.length}`;
    dialog.querySelector('.dialog-nav').hidden = items.length === 1;
    dialog.querySelector('[data-direction="-1"]').disabled = index === 0;
    dialog.querySelector('[data-direction="1"]').disabled = index === items.length - 1;
  }

  const instance = {
    element: dialog,
    isOpen: () => dialog.open,
    open(images, startIndex = 0) {
      if (!images.length) return;
      items = images;
      index = Math.max(0, Math.min(items.length - 1, startIndex));
      render();
      if (!dialog.open) {
        previousOverflow = doc.body.style.overflow;
        doc.body.style.overflow = 'hidden';
        dialog.showModal();
        dialog.dispatchEvent(new Event('gallerychange'));
      }
    }
  };
  function move(direction) {
    index = Math.max(0, Math.min(items.length - 1, index + direction));
    render();
  }
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => move(Number(button.dataset.direction))));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    doc.body.style.overflow = previousOverflow;
    dialog.dispatchEvent(new Event('gallerychange'));
  });
  instances.set(doc, instance);
  return instance;
}
