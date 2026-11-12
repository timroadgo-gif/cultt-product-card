// GalleryPager factory: segmented pagination for a swipeable photo gallery (spec.md).
// createGalleryPager({ count }) → <div> with setProgress(p): p is the gallery's scroll position in photos
// (0 = first, fractional while moving; values outside 0…count−1 wrap, so loop clones map onto real photos).
// Between photos A and B at fraction f, A's weight is 1 − f and B's is f; CSS turns the weight (--w) into length
// (idle → active width) and colour (idle → active). A + B always add up to the same length, so A's left edge and B's
// right edge stay put while the boundary between them slides with the swipe; nothing else moves, the height never changes.
// Pure function of p: drive it from the scroller every frame (finger, momentum, snap); no timers, no transitions.
export function createGalleryPager({ count = 1 } = {}) {
  if (!Number.isInteger(count) || count < 1) throw new Error(`GalleryPager: count must be a positive integer, got ${count}`);
  const el = Object.assign(document.createElement("div"), { className: "ds-gallery-pager" });
  el.setAttribute("role", "img");
  el.hidden = count < 2; // one photo: nothing to page
  const segments = Array.from({ length: count }, () => Object.assign(document.createElement("span"), { className: "ds-gallery-pager__segment" }));
  el.append(...segments);
  let labelled = -1;
  el.setProgress = (progress) => {
    const i0 = Math.floor(progress), f = progress - i0;
    const a = ((i0 % count) + count) % count, b = (a + 1) % count;
    segments.forEach((seg, i) => seg.style.setProperty("--w", (i === a ? 1 - f : i === b && count > 1 ? f : 0).toFixed(4)));
    const current = f < .5 ? a : b; // accessible name follows the photo that covers most of the frame
    if (current !== labelled) { labelled = current; el.setAttribute("aria-label", `Фото ${current + 1} из ${count}`); }
  };
  el.setProgress(0);
  return el;
}
