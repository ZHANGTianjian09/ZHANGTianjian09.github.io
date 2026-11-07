import assert from 'node:assert/strict';
import { createPlaybackGroup } from '../assets/components/playback.js';

// Exercise input and lifecycle events with a deterministic clock, without a browser dependency.
class Element {
  constructor(parent = null) {
    this.parent = parent;
    this.listeners = new Map();
    this.attributes = new Map();
    this.dataset = {};
    this.classList = { toggle() {} };
  }
  addEventListener(type, callback) {
    const handlers = this.listeners.get(type) || [];
    this.listeners.set(type, [...handlers, callback]);
  }
  emit(type, properties = {}) {
    const event = { target:this, detail:1, preventDefault() {}, ...properties };
    for (const callback of this.listeners.get(type) || []) callback(event);
  }
  append(child) { child.parent = this; }
  getAttribute(name) { return this.attributes.get(name) || null; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  matches() { return Boolean(this.focusVisible); }
  contains(node) { return Boolean(node && (node === this || this.contains(node.parent))); }
  closest() { return this.control ? this : this.parent?.closest(); }
  querySelector() { return this.hint; }
}

const originals = Object.fromEntries(['matchMedia','IntersectionObserver','setTimeout','clearTimeout'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
const timers = new Map();
let timerId = 0;
globalThis.setTimeout = callback => { timers.set(++timerId, callback); return timerId; };
globalThis.clearTimeout = id => timers.delete(id);
const step = () => {
  const pending = [...timers.values()];
  timers.clear();
  pending.forEach(callback => callback());
};

function fixture({ touchOnly = false, reduced = false } = {}) {
  timers.clear();
  const doc = new Element();
  doc.createElement = () => new Element();
  doc.documentElement = new Element();
  const media = new Element();
  media.matches = reduced;
  globalThis.matchMedia = query => query.includes('reduced-motion') ? media : Object.assign(new Element(), { matches:!touchOnly });
  let visibility;
  globalThis.IntersectionObserver = class {
    constructor(callback) { visibility = callback; }
    observe() {}
  };
  const gallery = { element:new Element(), open:false, isOpen() { return this.open; } };
  const group = createPlaybackGroup(doc, gallery, en => en);
  function figure() {
    const node = new Element();
    node.hint = new Element(node);
    group.create(node, 4, index => { node.frame = index; });
    visibility([{ target:node, isIntersecting:true }]);
    return node;
  }
  return { doc, media, gallery, group, figure, visible(node, value) { visibility([{ target:node, isIntersecting:value }]); } };
}

try {
  const hover = fixture();
  const first = hover.figure(), second = hover.figure();
  step();
  assert.equal(first.frame, 0, 'Entering the viewport must not start an animation.');
  first.emit('pointerenter', { pointerType:'mouse' });
  step();
  assert.equal(first.frame, 1, 'Hover starts playback.');
  assert.equal(second.frame, 0, 'Playback remains local to the hovered figure.');
  first.emit('pointerleave', { pointerType:'mouse' });
  step();
  assert.equal(first.frame, 1, 'Leaving preserves the paused frame.');
  assert.equal(first.dataset.playback, 'paused');
  first.emit('pointerenter', { pointerType:'mouse' });
  step(); step(); step();
  assert.equal(first.frame, 3);
  assert.equal(first.dataset.playback, 'complete', 'Playback stops at the final frame.');
  first.emit('pointerleave', { pointerType:'mouse' });
  first.emit('pointerenter', { pointerType:'mouse' });
  assert.equal(first.frame, 0, 'Re-entering after completion starts a fresh run.');
  hover.gallery.open = true;
  hover.gallery.element.emit('gallerychange');
  step();
  assert.equal(first.frame, 0, 'An open image dialog suspends animation.');
  hover.gallery.open = false;
  hover.gallery.element.emit('gallerychange');
  hover.doc.hidden = true;
  hover.doc.emit('visibilitychange');
  step();
  assert.equal(first.frame, 0, 'A hidden document suspends animation.');
  hover.doc.hidden = false;
  hover.doc.emit('visibilitychange');
  hover.visible(first, false);
  step();
  assert.equal(first.frame, 0, 'Offscreen figures stay paused.');
  hover.visible(first, true);
  step();
  assert.equal(first.frame, 1);

  const touch = fixture({ touchOnly:true });
  const tapped = touch.figure();
  tapped.emit('pointerenter', { pointerType:'touch' });
  step();
  assert.equal(tapped.frame, 0, 'A touch entering during a scroll must not start playback.');
  tapped.emit('pointerdown', { pointerType:'touch' });
  tapped.emit('click');
  tapped.emit('pointerleave', { pointerType:'touch' });
  step();
  assert.equal(tapped.frame, 1, 'A touch tap starts playback after the finger lifts.');
  const link = new Element(tapped);
  link.control = true;
  const linkIcon = new Element(link);
  tapped.emit('click', { target:linkIcon });
  step();
  assert.equal(tapped.frame, 2, 'Nested links and controls must not toggle playback.');
  tapped.emit('click');
  step();
  assert.equal(tapped.frame, 2, 'A second touch tap pauses.');

  const keyboard = fixture();
  const focused = keyboard.figure();
  focused.focusVisible = true;
  focused.emit('focusin');
  step();
  assert.equal(focused.frame, 1, 'Keyboard focus starts playback.');
  focused.emit('keydown', { key:' ' });
  step();
  assert.equal(focused.frame, 1, 'Space pauses without moving the page.');
  focused.emit('keydown', { key:'Enter' });
  focused.emit('keydown', { key:'Enter', repeat:true });
  step();
  assert.equal(focused.frame, 2, 'Enter resumes; key repeat cannot toggle repeatedly.');
  focused.emit('focusout', { relatedTarget:new Element() });
  step();
  assert.equal(focused.frame, 2, 'Leaving keyboard focus pauses.');

  const reduced = fixture({ reduced:true });
  const staticFigure = reduced.figure();
  staticFigure.emit('pointerenter', { pointerType:'mouse' });
  staticFigure.focusVisible = true;
  staticFigure.emit('focusin');
  step();
  assert.equal(staticFigure.frame, 0, 'Reduced motion disables both hover and focus autoplay.');
  staticFigure.emit('click', { pointerType:'mouse' });
  staticFigure.emit('keydown', { key:'Enter' });
  step();
  assert.equal(staticFigure.frame, 2, 'Reduced motion advances exactly once per explicit action.');
  assert.equal(reduced.group.setReducedMotion(false), true, 'The gallery cannot override a system reduced-motion preference.');
  reduced.media.matches = false;
  reduced.media.emit('change');
  step();
  assert.equal(staticFigure.frame, 2, 'Returning to normal motion does not resume automatically.');
  reduced.group.setReducedMotion(true);
  staticFigure.emit('pointerenter', { pointerType:'mouse' });
  step();
  assert.equal(staticFigure.frame, 2, 'The component library step-through switch also disables hover.');
  assert.equal(staticFigure.dataset.playback, 'reduced');
  console.log('PASS: hover, pause/resume/replay, independent figures, touch, keyboard, lifecycle gates and reduced motion.');
} finally {
  for (const [key, descriptor] of Object.entries(originals)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
}
