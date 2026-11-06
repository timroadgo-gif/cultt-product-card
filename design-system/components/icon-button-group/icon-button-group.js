// GlassIconButtonGroup: two or three independent icon actions on ONE shared Liquid Glass capsule (e.g. [Share | Cart]).
// The group owns layout and the shared surface (applyGlass, shape "pill" → live lens from the shared engine); every item
// is its own <button> with its own 44 × 44 target, label and handler. No glass CSS here.
import { createIcon } from "../../icons/icon.js?v=e3d22d48c81d";
import { applyGlass } from "../../glass/glass.js?v=e3d22d48c81d";

const ICON_SIZES = ["standard", "large"];

export function createIconButtonGroup({ items = [], ariaLabel = "", iconSize = "standard", refraction = true } = {}) {
  if (items.length < 2 || items.length > 3) throw new Error("IconButtonGroup: 2–3 items");
  if (!ICON_SIZES.includes(iconSize)) throw new Error(`IconButtonGroup: iconSize "${iconSize}" is not one of ${ICON_SIZES.join(" | ")}`);
  const group = document.createElement("div");
  group.className = "ds-icon-button-group";
  group.setAttribute("role", "group");
  if (ariaLabel) group.setAttribute("aria-label", ariaLabel);
  for (const { icon, ariaLabel: label, onClick } of items) {
    if (!icon || !label) throw new Error("IconButtonGroup: every item needs icon and ariaLabel");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ds-icon-button-group__item";
    button.setAttribute("aria-label", label);
    button.append(createIcon(icon, { presentation: iconSize === "large" ? "large" : "compact" }));
    if (onClick) button.addEventListener("click", onClick);
    group.append(button);
  }
  group.dataset.iconSize = iconSize;
  applyGlass(group, { shape: "pill", material: "light", refraction });
  return group;
}
