// Alert factory (confirmation of an urgent decision). createAlert({ heading, message, confirm, cancel }) → <div role="alertdialog">.
// Content only: the modal host centres it, adds ModalBackdrop, traps focus and maps Escape to `cancel`.
import { createButton } from "../button/button.js?v=50e762cac2a1";
import { createTextAction } from "../text-action/text-action.js?v=50e762cac2a1";

let uid = 0;

export function createAlert({ heading, message, confirm, cancel } = {}) {
  if (!heading) throw new Error("Alert: heading is required");
  if (!confirm?.label || !cancel?.label) throw new Error("Alert: confirm and cancel actions with labels are required");
  const id = `ds-alert-${++uid}`;
  const el = (tag, cls, text) => Object.assign(document.createElement(tag), { className: cls, ...(text ? { textContent: text } : {}) });

  const root = el("div", "ds-alert ds-corner");
  root.setAttribute("role", "alertdialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", `${id}-h`);
  root.tabIndex = -1;
  const h = el("h2", "ds-alert__heading ds-text-popup-heading", heading);
  h.id = `${id}-h`;
  const text = el("div", "ds-alert__text");
  text.append(h);
  if (message) {
    const p = el("p", "ds-alert__message ds-text-popup-body", message);
    p.id = `${id}-m`;
    root.setAttribute("aria-describedby", p.id);
    text.append(p);
  }
  const cancelBtn = createTextAction({ label: cancel.label, onClick: cancel.onClick });
  cancelBtn.dataset.alertCancel = "";
  const actions = el("div", "ds-alert__actions");
  // Confirm is the secondary (quiet) Button: the consequence must not be the visually inviting choice.
  actions.append(createButton({ label: confirm.label, variant: "secondary", width: "fill", onClick: confirm.onClick }), cancelBtn);
  root.append(text, actions);
  return root;
}
