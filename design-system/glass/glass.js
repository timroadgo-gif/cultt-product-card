// GlassSurface runtime. applyGlass(el, { shape }) puts the shared native-inspired material (css/glass.css) on an
// element and adds its lens layer: an empty .ds-glass__lens filling the surface, which the Liquid Glass engine
// (glass/engine.js → vendored liquidGL) renders with real refraction of the content behind (WebGPU/WebGL, every
// browser with a GPU context, iOS Safari included). The CSS material always stays: it is the look before the first
// snapshot and the whole look where the engine is off (no WebGL, Reduce Transparency, ?glass=flat).

import { attachLens, engineAvailable } from "./engine.js?v=3d5feb74ed4c";

export const SHAPES = ["circle", "pill", "rounded"];
export const MATERIALS = ["light"]; // native light appearance; other materials need user approval

export const supportsRefraction = engineAvailable;

export function applyGlass(el, { shape = "circle", material = "light", refraction = true } = {}) {
  if (!SHAPES.includes(shape)) throw new Error(`GlassSurface: shape "${shape}" is not one of ${SHAPES.join(" | ")}`);
  if (!MATERIALS.includes(material)) throw new Error(`GlassSurface: material "${material}" is not approved`);
  el.classList.add("ds-glass");
  if (shape === "rounded") el.classList.add("ds-corner");
  Object.assign(el.dataset, { shape, material });
  if (refraction && !el.querySelector(":scope > .ds-glass__lens")) {
    const lens = document.createElement("span");
    lens.className = "ds-glass__lens";
    lens.setAttribute("aria-hidden", "true");
    el.prepend(lens);
    attachLens(lens, { material });
  }
  return el;
}

export function createGlassSurface({ tag = "div", shape, material, refraction } = {}) {
  return applyGlass(document.createElement(tag), { shape, material, refraction });
}
