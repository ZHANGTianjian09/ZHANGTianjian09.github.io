import { initImageGallery } from './gallery.js';
import { initDiagrams } from './diagrams.js';
import { initNavigation } from './navigation.js';
import { initCopyButtons } from './copy.js';

export { initImageGallery, initDiagrams, initNavigation, initCopyButtons };

/** Shared entry point for the homepages and the live component gallery. */
export function initComponents(root = document) {
  const gallery = initImageGallery(root);
  const diagrams = initDiagrams(root);
  initNavigation(root, gallery);
  initCopyButtons(root);
  const doc = root.ownerDocument || root;
  doc.documentElement.classList.add('js');
  return { gallery, diagrams };
}
