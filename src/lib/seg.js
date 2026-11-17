// Animated segmented controls: every `.seg` gets a pill that slides to the selected button.
// It only writes CSS variables (--seg-x/y/w/h) on the `.seg` element; the pill itself is its ::before (see app.css),
// so Svelte's own DOM is never touched. Controls added later (tabs, re-rendered cards) are picked up automatically.

export function initSegs() {
  const live = new Map(); // .seg element -> cleanup

  const attach = (node) => {
    if (live.has(node)) return;
    const place = () => {
      const on = node.querySelector('[aria-pressed="true"], [aria-selected="true"]');
      if (!on) return node.style.setProperty('--seg-on', '0');
      node.style.setProperty('--seg-x', `${on.offsetLeft}px`);
      node.style.setProperty('--seg-y', `${on.offsetTop}px`);
      node.style.setProperty('--seg-w', `${on.offsetWidth}px`);
      node.style.setProperty('--seg-h', `${on.offsetHeight}px`);
      node.style.setProperty('--seg-on', '1');
      node.dataset.thumb = '';
    };
    const changes = new MutationObserver(place);
    changes.observe(node, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-pressed', 'aria-selected']
    });
    const resize = new ResizeObserver(place); // fonts loading, language switch, window resize
    resize.observe(node);
    place();
    // switch transitions on only after the first placement, so the pill doesn't fly in from the corner
    requestAnimationFrame(() => requestAnimationFrame(() => (node.dataset.ready = '')));
    live.set(node, () => {
      changes.disconnect();
      resize.disconnect();
    });
  };
  const detach = (node) => {
    live.get(node)?.();
    live.delete(node);
  };
  const each = (root, fn) => {
    if (root.nodeType !== 1) return;
    if (root.matches('.seg')) fn(root);
    root.querySelectorAll('.seg').forEach(fn);
  };

  each(document.body, attach);
  const watcher = new MutationObserver((records) => {
    for (const r of records) {
      r.addedNodes.forEach((n) => each(n, attach));
      r.removedNodes.forEach((n) => each(n, detach));
    }
  });
  watcher.observe(document.body, { childList: true, subtree: true });
  return () => {
    watcher.disconnect();
    [...live.keys()].forEach(detach);
  };
}
