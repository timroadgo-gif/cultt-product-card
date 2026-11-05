// Icon presentations: fit a library icon into a context without touching its geometry. No DOM here, so the same
// math runs in the browser (icon.js) and in the checker (check.mjs).
// compact (glass icon buttons): the icon's optical bounds (registry `bounds`) are scaled so its larger side is
// `opticalSize` (× the icon's own `compact.scale`), centred on the grid centre (+ `compact.dx/dy` px) inside a
// `viewport` box, and every line is rendered at `stroke` px. Tokens: icon.presentation.compact.*.

export const PRESENTATIONS = ["compact", "large"]; // large: iconSize "large" glass buttons (tokens icon.presentation.large.*)
const CENTER = 12; // centre of the 24 grid; library icons are optically centred on it

// `pxScale` scales the registry dx/dy (authored in compact px) for larger presentations.
export function compactFit(meta, { viewport, opticalSize, stroke }, pxScale = 1) {
  if (!meta?.bounds) throw new Error("Icon presentation: registry `bounds` missing");
  const [x0, y0, x1, y1] = meta.bounds;
  const fix = { scale: 1, dx: 0, dy: 0, ...meta.compact };
  fix.dx *= pxScale; fix.dy *= pxScale;
  const solid = meta.type === "fill"; // solid shapes scale as a whole; line icons get a normalised stroke
  const side = Math.max(x1 - x0, y1 - y0);
  // line icons: bounds include the library weight (1 unit); after fitting that weight is replaced by `stroke` px
  const s = (solid ? opticalSize / side : (opticalSize - stroke) / (side - 1)) * fix.scale; // px per grid unit
  const visible = (b) => (solid ? b * s : (b - 1) * s + stroke);
  const box = viewport / s;
  const cx = CENTER - fix.dx / s;
  const cy = CENTER - fix.dy / s;
  return {
    scale: s,
    viewBox: [cx - box / 2, cy - box / 2, box, box],
    unitStroke: stroke / s, // stroke in grid units that renders as `stroke` px
    width: visible(x1 - x0),
    height: visible(y1 - y0),
    stroke: solid ? 0 : stroke,
  };
}
