// GlassIconButton factory. createIconButton({ icon, ariaLabel, onClick }) → 44 × 44 circular <button> with the shared
// native-inspired glass (GlassSurface) and the icon in the compact presentation (~15 viewport, optically fitted path,
// 0.9px stroke). size "compact": the glass circle shrinks to 32 (secondary controls such as a popup close) while the
// <button> keeps the 44 × 44 hit area around it. The surface refracts through the shared Liquid Glass engine
// (glass/engine.js); refraction: false keeps the CSS material only (e.g. a control that is not painted until focused).
// This file never styles glass or resizes icon geometry itself.
import { createIcon } from "../../icons/icon.js?v=164ff6914683";
import { applyGlass } from "../../glass/glass.js?v=164ff6914683";

const MATERIALS = ["glass-light"]; // IconButton / Glass / Light / 44 is the only approved variant

const SIZES = ["regular", "compact"];
const ICON_SIZES = ["standard", "large"]; // large: approved 2026-11-06 (product page top bar), regular size only

export function createIconButton({ icon, ariaLabel, material = "glass-light", size = "regular", iconSize = "standard", type = "button", refraction = true, onClick } = {}) {
  if (!icon) throw new Error("IconButton: icon is required");
  if (!ariaLabel) throw new Error("IconButton: ariaLabel is required (icon-only control)");
  if (!MATERIALS.includes(material)) throw new Error(`IconButton: material "${material}" is not one of ${MATERIALS.join(" | ")}`);
  if (!SIZES.includes(size)) throw new Error(`IconButton: size "${size}" is not one of ${SIZES.join(" | ")}`);
  if (!ICON_SIZES.includes(iconSize)) throw new Error(`IconButton: iconSize "${iconSize}" is not one of ${ICON_SIZES.join(" | ")}`);
  if (iconSize === "large" && size !== "regular") throw new Error("IconButton: iconSize \"large\" is defined for size \"regular\" only");

  const el = document.createElement("button");
  el.className = `ds-icon-button${size === "compact" ? " ds-icon-button--compact" : ""}${iconSize === "large" ? " ds-icon-button--large-icon" : ""}`;
  el.type = type;
  el.setAttribute("aria-label", ariaLabel);
  const icn = createIcon(icon, { presentation: iconSize === "large" ? "large" : "compact" });
  if (size === "compact") {
    const surface = document.createElement("span");
    surface.className = "ds-icon-button__surface";
    surface.append(icn);
    el.append(surface);
    applyGlass(surface, { shape: "circle", material: "light", refraction });
  } else {
    el.append(icn);
    applyGlass(el, { shape: "circle", material: "light", refraction });
  }
  if (onClick) el.addEventListener("click", onClick);
  return el;
}
