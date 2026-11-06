// Field factory (Figma «Input Form»). createField({ kind: "text" | "select", label, placeholder, ... }) → element.
import { createIcon } from "../../icons/icon.js?v=b3ca56ba5011";

const KINDS = ["text", "select"];

const el = (tag, className, text) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
};

export function createField({ kind = "text", label, placeholder = "", type = "text", autocomplete, onClick } = {}) {
  if (!KINDS.includes(kind)) throw new Error(`Field: kind "${kind}" is not one of ${KINDS.join(" | ")}`);
  if (!label) throw new Error("Field: label is required");

  const content = el("span", "ds-field__content");
  content.append(el("span", "ds-field__label ds-text-label", label));

  if (kind === "text") {
    const root = el("label", "ds-field ds-corner");
    root.dataset.kind = kind;
    const input = el("input", "ds-field__input ds-text-input");
    Object.assign(input, { type, placeholder });
    if (autocomplete) input.autocomplete = autocomplete;
    content.append(input);
    root.append(content);
    return root;
  }

  // select: the field shows the placeholder until a value is chosen; the option list is the caller's (onClick).
  const root = el("button", "ds-field ds-corner");
  root.type = "button";
  root.dataset.kind = kind;
  root.setAttribute("aria-haspopup", "listbox");
  const value = el("span", "ds-field__value ds-text-input", placeholder);
  value.dataset.empty = "";
  content.append(value);
  const chev = el("span", "ds-field__chevron");
  chev.append(createIcon("chevron-down"));
  root.append(content, chev);
  if (onClick) root.addEventListener("click", onClick);
  return root;
}

export function setFieldValue(root, text) {
  const value = root.querySelector(".ds-field__value");
  if (!value) return;
  value.textContent = text;
  value.toggleAttribute("data-empty", false);
}
