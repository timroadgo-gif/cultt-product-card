// Field factory (Figma «Input Form», refined 2026-11-07).
// createField({ kind: "text" | "select", label, placeholder, ... }) → element; setFieldValue, setFieldError.
import { createIcon } from "../../icons/icon.js?v=65aedeb9940c";

const KINDS = ["text", "select"];

const el = (tag, className, text) => {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = text;
  return n;
};

export function createField({ kind = "text", label, placeholder = "", type = "text", autocomplete, value, disabled = false, readOnly = false, onClick } = {}) {
  if (!KINDS.includes(kind)) throw new Error(`Field: kind "${kind}" is not one of ${KINDS.join(" | ")}`);
  if (!label) throw new Error("Field: label is required");

  const content = el("span", "ds-field__content");
  content.append(el("span", "ds-field__label ds-text-caption", label));

  if (kind === "text") {
    const root = el("label", "ds-field ds-corner");
    root.dataset.kind = kind;
    const input = el("input", "ds-field__input ds-text-input");
    Object.assign(input, { type, placeholder, disabled, readOnly });
    if (value != null) input.value = value;
    if (autocomplete) input.autocomplete = autocomplete;
    content.append(input);
    root.append(content);
    return root;
  }

  // select: the field shows the placeholder until a value is chosen; the option list is the caller's (onClick).
  // A read-only select is not a control: it renders as a plain read-only surface without a chevron.
  const root = el(readOnly ? "div" : "button", "ds-field ds-corner");
  root.dataset.kind = kind;
  const valueEl = el("span", "ds-field__value ds-text-input", value ?? placeholder);
  if (value == null) valueEl.dataset.empty = "";
  content.append(valueEl);
  if (readOnly) {
    root.dataset.readonly = "";
    root.append(content);
    return root;
  }
  root.type = "button";
  root.disabled = disabled;
  root.setAttribute("aria-haspopup", "listbox");
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

// setFieldError(field, message | null): error outline + message below the field; null clears it.
// In a gap-based stack, wrap the field in its own element first (spec.md), so the message sits 4 below it.
let messageId = 0;
export function setFieldError(root, message) {
  const control = root.querySelector(".ds-field__input") ?? root;
  let note = root.nextElementSibling?.classList.contains("ds-field-message") ? root.nextElementSibling : null;
  if (!message) {
    delete root.dataset.state;
    control.removeAttribute("aria-invalid");
    control.removeAttribute("aria-describedby");
    note?.remove();
    return;
  }
  if (!note) {
    note = el("p", "ds-field-message ds-text-caption");
    note.id = `ds-field-message-${++messageId}`;
    root.after(note);
  }
  note.dataset.state = "error";
  note.textContent = message;
  root.dataset.state = "error";
  control.setAttribute("aria-invalid", "true");
  control.setAttribute("aria-describedby", note.id);
}
