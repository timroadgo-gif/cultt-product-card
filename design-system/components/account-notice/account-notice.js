// AccountNotice factory. createAccountNotice({ icon, message, parts }) where parts = strings and { link, onClick }.
import { createIcon } from "../../icons/icon.js?v=a27218eab794";

export function createAccountNotice({ icon = "user", message, parts = [] } = {}) {
  if (!message) throw new Error("AccountNotice: message is required");
  const root = Object.assign(document.createElement("div"), { className: "ds-account-notice ds-corner" });
  const avatar = Object.assign(document.createElement("span"), { className: "ds-account-notice__avatar ds-corner" });
  avatar.dataset.corner = "circular";
  avatar.append(createIcon(icon));
  const text = Object.assign(document.createElement("div"), { className: "ds-account-notice__text" });
  const line = Object.assign(document.createElement("p"), { className: "ds-text-body-s" });
  for (const p of parts) {
    if (typeof p === "string") { line.append(p); continue; }
    const a = Object.assign(document.createElement("button"), { type: "button", className: "ds-account-notice__link", textContent: p.link });
    if (p.onClick) a.addEventListener("click", p.onClick);
    line.append(a);
  }
  text.append(Object.assign(document.createElement("p"), { className: "ds-text-body-s", textContent: message }), line);
  root.append(avatar, text);
  return root;
}
