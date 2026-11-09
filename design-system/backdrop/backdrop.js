// ModalBackdrop runtime. createModalBackdrop() → element styled by css/backdrop.css; open/close it together with the
// modal. Keeps a stack per overlay container so nested modals never stack blur or dimming (only the lowest backdrop
// in a container renders the material). Separate containers (e.g. preview frames) are independent.

const stacks = new WeakMap();
const stackOf = (key) => {
  if (!stacks.has(key)) stacks.set(key, []);
  return stacks.get(key);
};

// `container`: the overlay host that owns this modal stack (default: the document).
export function createModalBackdrop({ scope = "viewport", container = document, platform, onDismiss } = {}) {
  const el = document.createElement("div");
  el.className = "ds-backdrop";
  el.setAttribute("aria-hidden", "true");
  el._dsContainer = container;
  if (scope === "container") el.dataset.scope = "container";
  if (platform) el.dataset.platform = platform; // force mobile/desktop values (previews); normally from the viewport
  if (onDismiss) el.addEventListener("click", onDismiss);
  return el;
}

export function openBackdrop(el) {
  const stack = stackOf(el._dsContainer ?? document);
  el._dsStack = stack;
  if (stack.length) el.dataset.nested = "";
  stack.push(el);
  // Commit the closed style first (forced layout), then switch: the fade runs without waiting for frames.
  void el.offsetWidth;
  el.dataset.state = "open";
}

export function closeBackdrop(el) {
  const stack = el._dsStack ?? [];
  const i = stack.indexOf(el);
  if (i !== -1) stack.splice(i, 1);
  el.dataset.state = "closing";
  el.style.opacity = "";
}
