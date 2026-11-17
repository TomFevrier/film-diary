import { app } from './state.svelte.js';

/**
 * Tooltip action: `use:tip={() => ({ title, sub, lines, films })}`.
 * Mouse: follows the pointer. Touch: tap to show, tap elsewhere to dismiss.
 */
let hideTimer;
export function tip(node, getContent) {
  let get = getContent;
  let lastType = 'mouse';
  const show = (x, y) => {
    clearTimeout(hideTimer);
    const c = get?.();
    app.tip = c ? { c, x, y } : null;
  };
  const down = (e) => {
    lastType = e.pointerType;
  };
  const enter = (e) => {
    if (e.pointerType !== 'touch') show(e.clientX, e.clientY);
  };
  const move = (e) => {
    if (e.pointerType !== 'touch' && app.tip) app.tip = { ...app.tip, x: e.clientX, y: e.clientY };
  };
  const leave = (e) => {
    if (e.pointerType !== 'touch') {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => (app.tip = null), 90);
    }
  };
  const click = () => {
    if (lastType !== 'touch') return;
    const r = node.getBoundingClientRect();
    show(r.left + r.width / 2, r.top);
  };
  const focus = () => {
    const r = node.getBoundingClientRect();
    show(r.left + r.width / 2, r.bottom);
  };
  const blur = () => {
    app.tip = null;
  };
  node.addEventListener('pointerdown', down);
  node.addEventListener('pointerenter', enter);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerleave', leave);
  node.addEventListener('click', click);
  node.addEventListener('focus', focus);
  node.addEventListener('blur', blur);
  return {
    update(next) {
      get = next;
    },
    destroy() {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointerenter', enter);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', leave);
      node.removeEventListener('click', click);
      node.removeEventListener('focus', focus);
      node.removeEventListener('blur', blur);
    }
  };
}

/** Enter / Space activates SVG elements used as buttons. */
export const onActivate = (fn) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn(e);
  }
};
