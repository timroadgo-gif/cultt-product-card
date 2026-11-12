// GalleryPager factory: segmented pagination for a swipeable photo gallery (spec.md).
// createGalleryPager({ count }) → <div> with setProgress(p): p is the gallery's scroll position in photos
// (0 = first, fractional while moving; values outside 0…count−1 wrap, so loop clones map onto real photos).
// Motion (user's reference recording, 2026-11-12): all lines are equal grey tracks; the black fill flows between them.
// Between photos A (left) and B (right) at fraction f, A's fill covers the right part [f, 1] of A and B's fill the left
// part [0, f] of B — moving forward the black drains out of A towards B and pours into B from the side facing A;
// backward it is the mirror image. Pure function of p: drive it from the scroller every frame (finger, momentum, snap);
// no timers, no transitions; across the loop seam the fill leaves the last line on the right and enters the first.
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
    segments.forEach((seg, i) => {
      const [from, to] = i === a ? [f, 1] : i === b && count > 1 ? [0, f] : [0, 0];
      seg.style.setProperty("--from", from.toFixed(4));
      seg.style.setProperty("--to", to.toFixed(4));
    });
    const current = f < .5 ? a : b; // accessible name follows the photo that covers most of the frame
    if (current !== labelled) { labelled = current; el.setAttribute("aria-label", `Фото ${current + 1} из ${count}`); }
  };
  el.setProgress(0);
  return el;
}
