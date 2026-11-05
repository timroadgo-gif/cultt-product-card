// TextAction factory (Figma Buttons «Ghost»). createTextAction({ label, onClick }) → <button>.
export function createTextAction({ label, type = "button", onClick } = {}) {
  if (!label) throw new Error("TextAction: label is required");
  const b = Object.assign(document.createElement("button"), { className: "ds-text-action ds-text-body", type, textContent: label });
  if (onClick) b.addEventListener("click", onClick);
  return b;
}
