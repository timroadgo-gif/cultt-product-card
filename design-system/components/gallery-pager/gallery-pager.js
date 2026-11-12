// GalleryPager factory: segmented pagination for a swipeable photo gallery (spec.md).
// createGalleryPager({ count }) → <div> with setProgress(p): p is the gallery's scroll position in photos
// (0 = first, fractional while moving; values outside 0…count−1 wrap, so loop clones map onto real photos).
// Motion (user's reference recording, 2026-11-12): all lines are equal grey tracks; the black fill flows between them.
// The line of the photo the gallery last rested on keeps its full-length fill and fades it out — no black tail; the
// neighbour being scrolled to fills with black from the side facing it (forward: from its left edge, back: from its
// right edge), in proportion to the scroll fraction. Reversing mid-gesture keeps the roles, so it simply runs back. Pure function of p: drive it from the scroller every frame (finger, momentum, snap);
// no timers, no transitions; across the loop seam the fill leaves the last line on the right and enters the first.
const FILL_END = 0.8, FADE_END = 0.65; // fraction of the scroll at which the fill / fade is complete
const smooth = (x) => x * x * (3 - 2 * x); // soft start and finish, so the line follows the scroll's own easing

export function createGalleryPager({ count = 1 } = {}) {
  if (!Number.isInteger(count) || count < 1) throw new Error(`GalleryPager: count must be a positive integer, got ${count}`);
  const el = Object.assign(document.createElement("div"), { className: "ds-gallery-pager" });
  el.setAttribute("role", "img");
  el.hidden = count < 2; // one photo: nothing to page
  const segments = Array.from({ length: count }, () => Object.assign(document.createElement("span"), { className: "ds-gallery-pager__segment" }));
  el.append(...segments);
  let labelled = -1;
  let settled = 0; // the photo the gallery last rested on: its line is the one that fades out
  el.setProgress = (progress) => {
    const i0 = Math.floor(progress), f = progress - i0;
    const a = ((i0 % count) + count) % count, b = (a + 1) % count;
    if (f < 1e-3) settled = a; else if (f > 1 - 1e-3) settled = b;
    // Outgoing line (the settled one) keeps its full fill and fades it out — no black tail. The incoming line fills
    // from the side facing the outgoing one: B (right) from its left edge, A (left) from its right edge.
    const back = settled === b && a !== b; // moving from B back to A
    // Paced slightly ahead of the photo, eased (user: in tempo with the scroll, smoother): t = share of the way to the incoming photo; the new line is full at
    // t = FILL_END and the old one grey at t = FADE_END, then both hold while the photo finishes its snap.
    const t = back ? 1 - f : f;
    const fill = smooth(Math.min(1, t / FILL_END)), fade = 1 - smooth(Math.min(1, t / FADE_END));
    segments.forEach((seg, i) => {
      let from = 0, to = 0, alpha = 0;
      if (count > 1 && i === a) [from, to, alpha] = back ? [1 - fill, 1, 1] : [0, 1, fade];
      else if (count > 1 && i === b) [from, to, alpha] = back ? [0, 1, fade] : [0, fill, 1];
      else if (i === a) [from, to, alpha] = [0, 1, 1];
      seg.style.setProperty("--from", from.toFixed(4));
      seg.style.setProperty("--to", to.toFixed(4));
      seg.style.setProperty("--fill-opacity", alpha.toFixed(4));
    });
    const current = f < .5 ? a : b; // accessible name follows the photo that covers most of the frame
    if (current !== labelled) { labelled = current; el.setAttribute("aria-label", `Фото ${current + 1} из ${count}`); }
  };
  el.setProgress(0);
  return el;
}
