// Shared Icon component. createIcon(name, { size, label, presentation }) → <svg class="ds-icon">. Colour is inherited (currentColor).
import { ICONS, META } from "./icons.generated.js?v=ceabc4725d83";
import { PRESENTATIONS, compactFit } from "./presentation.js?v=ceabc4725d83";

export const ICON_SIZES = [16, 20, 24, 32, 48]; // documented set; any px value renders proportionally

export function iconMarkup(name, { size = 24, label = "" } = {}) {
  const svg = ICONS[name];
  if (!svg) {
    const reason = META[name] ? `"${name}" is reserved but has no approved geometry yet` : `unknown icon "${name}"`;
    throw new Error(`Icon: ${reason}`);
  }
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return svg.replace("<svg ", `<svg class="ds-icon" width="${size}" height="${size}" ${a11y} `);
}

export function createIcon(name, { presentation, ...options } = {}) {
  const tpl = document.createElement("template");
  tpl.innerHTML = iconMarkup(name, options);
  const svg = tpl.content.firstElementChild;
  return presentation ? applyPresentation(svg, META[name], presentation) : svg;
}

// Fits an icon <svg> into a presentation by its viewBox and rendered stroke only; the paths are never edited.
export function applyPresentation(svg, meta, presentation = "compact") {
  if (!PRESENTATIONS.includes(presentation)) throw new Error(`Icon: presentation "${presentation}" is not one of ${PRESENTATIONS.join(" | ")}`);
  const tokens = presentationTokens(presentation);
  const fit = compactFit(meta, tokens, presentation === "compact" ? 1 : tokens.opticalSize / presentationTokens("compact").opticalSize);
  svg.setAttribute("viewBox", fit.viewBox.map((v) => +v.toFixed(4)).join(" "));
  svg.setAttribute("width", tokens.viewport);
  svg.setAttribute("height", tokens.viewport);
  svg.dataset.presentation = presentation;
  if (!fit.stroke) return svg;
  for (const el of svg.querySelectorAll(GEOMETRY)) {
    if (el.closest("clipPath")) continue;
    const stroke = el.closest("[stroke]")?.getAttribute("stroke");
    if (stroke && stroke !== "none") {
      el.style.strokeWidth = (el.closest("[stroke-width]")?.getAttribute("stroke-width") ?? 1) * fit.unitStroke;
    } else if (el.closest("[fill]")?.getAttribute("fill") !== "none") {
      // outline-fill: the 1-unit line is baked into the shape; a same-colour stroke brings it up to the target weight
      Object.assign(el.style, { stroke: "currentColor", strokeWidth: Math.max(0, fit.unitStroke - 1), strokeLinejoin: "round" });
    }
  }
  return svg;
}

const GEOMETRY = "path, circle, ellipse, rect, line, polyline, polygon";

function presentationTokens(name = "compact") {
  const css = getComputedStyle(document.documentElement);
  const px = (key) => {
    const v = parseFloat(css.getPropertyValue(`--icon-presentation-${name}-${key}`));
    if (!v) throw new Error(`Icon: token --icon-presentation-${name}-${key} is missing (load tokens/tokens.css)`);
    return v;
  };
  return { viewport: px("viewport"), opticalSize: px("optical-size"), stroke: px("stroke") };
}
