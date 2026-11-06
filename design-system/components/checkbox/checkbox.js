// Checkbox factory (Figma «Check Boxes» M). createCheckbox({ label, checked, onChange }) → <label>.
import { createIcon } from "../../icons/icon.js?v=8dc784a2f119";

export function createCheckbox({ label, checked = false, name, onChange } = {}) {
  if (!label) throw new Error("Checkbox: label is required");
  const root = document.createElement("label");
  root.className = "ds-checkbox";
  const input = Object.assign(document.createElement("input"), { type: "checkbox", className: "ds-checkbox__input", checked });
  if (name) input.name = name;
  if (onChange) input.addEventListener("change", () => onChange(input.checked));
  const box = Object.assign(document.createElement("span"), { className: "ds-checkbox__box ds-corner" });
  box.append(createIcon("check"));
  const text = Object.assign(document.createElement("span"), { className: "ds-checkbox__label ds-text-body-s", textContent: label });
  root.append(input, box, text);
  return root;
}
