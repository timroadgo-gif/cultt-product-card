// DragIndicator factory (grabber). createDragIndicator() → decorative <div>; the host places it and owns the gesture.
export function createDragIndicator() {
  const el = Object.assign(document.createElement("div"), { className: "ds-drag-indicator ds-corner" });
  el.dataset.corner = "circular";
  el.setAttribute("aria-hidden", "true");
  return el;
}
