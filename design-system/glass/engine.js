// Liquid Glass engine adapter: the ONLY module that talks to the vendored renderer (vendor/liquidGL.js, liquidGL
// v3.0.0, MIT, naughtyduk/liquidGL @ 88f681a). GlassSurface (glass.js) calls attachLens(); nothing else may import
// the vendor file (checked by tools/check-ui.mjs).
// The renderer refracts a WebGPU/WebGL snapshot of the page through a bevelled lens (real lensing, specular edge) and
// recaptures it on DOM mutations and finished transitions. Without WebGL, with Reduce Transparency, or with
// ?glass=flat the CSS material in css/glass.css stays on its own.
// Preset values come from tokens (glass.<material>.lens.*); there are no per-call shader settings.

import liquidGL from "./vendor/liquidGL.js?v=a14dbefbe8a9";

export const PRESETS = ["light"]; // one preset per approved material

const NO_LENS = matchMedia("(prefers-reduced-transparency: reduce)");
const REDUCED_MOTION = matchMedia("(prefers-reduced-motion: reduce)");
const live = new Map(); // lens element → liquidGL instance
const MAX_RENDERERS = 8; // each renderer is one WebGPU/WebGL context; browsers drop the oldest past ~16 (fewer on iOS)
let seq = 0;
let sweeper = null;

const hasGPU = (() => {
  if (typeof navigator !== "undefined" && "gpu" in navigator) return true;
  const gl = document.createElement("canvas").getContext("webgl2") || document.createElement("canvas").getContext("webgl");
  gl?.getExtension("WEBGL_lose_context")?.loseContext(); // release the probe context at once
  return !!gl;
})();

export const engineAvailable = () => hasGPU && !NO_LENS.matches && !location.search.includes("glass=flat");

const num = (style, name) => parseFloat(style.getPropertyValue(name));

// Token preset → renderer options. The renderer offsets samples in units of the whole snapshot (UV of <body>), so
// pixel tokens are divided by the snapshot size; scaleLenses() keeps that true when the page resizes.
function preset(el, material) {
  const s = getComputedStyle(el);
  const p = `--glass-${material}-lens-`;
  return {
    px: { refraction: num(s, `${p}refraction`), bevelDepth: num(s, `${p}edge-offset`) },
    bevelWidth: num(s, `${p}bevel-width`),
    magnify: num(s, `${p}magnify`),
    resolution: num(s, `${p}resolution`),
    frost: 0, // frost and saturation live in the CSS material; the lens only bends light
    specular: false, // the renderer's time-animated highlight is not Apple's motion-driven one; the CSS rim lights the edge
    shadow: false, // the material draws its own contact shadow
    tilt: false,
    reveal: REDUCED_MOTION.matches ? "none" : "fade",
    // Lens z = surface z-index Z (css/glass.css). Self-anchored surface: canvas at Z − Z − 1 = −1 inside it (above
    // its background, below the fill layer, light, rim and content). Shared layer: canvas at Z − 1, under the surface.
    zIndex: num(s, "--glass-lens-z-index"),
  };
}

// What a lens refracts: the whole page by default, or — for controls marked inside [data-glass-source="<selector>"] —
// one pinned element (e.g. a sticky product gallery that content scrolls over). The renderer maps lenses to the
// snapshot by position relative to that element, so a pinned source stays correct while the page scrolls.
const sourceOf = (el) => el.closest("[data-glass-source]")?.dataset.glassSource || "body";
const sourceEl = (sel) => document.querySelector(sel) || document.body;
const snapshotScale = (sel = "body") => {
  const b = sourceEl(sel);
  return (b.scrollWidth + b.scrollHeight) / 2 || 1;
};
const toUV = ({ refraction, bevelDepth }, sel) => {
  const k = snapshotScale(sel);
  return { refraction: refraction / k, bevelDepth: bevelDepth / k };
};
function scaleLenses() {
  for (const lens of live.values()) if (lens?._dsPx) Object.assign(lens.options, toUV(lens._dsPx, lens._dsSource));
}
addEventListener("resize", scaleLenses, { passive: true });
new ResizeObserver(scaleLenses).observe(document.documentElement);

// Attach a lens to `el` (an empty layer filling the glass surface) once it is laid out; returns a detach function.
// Surfaces that appear in the same frame are attached with ONE renderer call: every liquidGL() call probes WebGL with
// a throwaway context, and dozens of calls make the browser drop live contexts.
export function attachLens(el, { material = "light" } = {}) {
  if (!PRESETS.includes(material)) throw new Error(`Glass engine: preset "${material}" is not approved`);
  if (!engineAvailable()) return () => {};
  el.dataset.dsLens ||= String(++seq);
  const start = () => {
    if (live.has(el) || queue.has(el) || !el.isConnected || !el.offsetWidth) return;
    queue.set(el, { material, source: sourceOf(el) });
    flushSoon();
  };
  const ro = new ResizeObserver(start);
  ro.observe(el);
  requestAnimationFrame(start);
  return () => { ro.disconnect(); queue.delete(el); detach(el); };
}

const queue = new Map(); // lens element → { material, source }, waiting for the next frame
let flushing = null;
const flushSoon = () => { flushing ??= requestAnimationFrame(flush); };

function flush() {
  flushing = null;
  const batch = [...queue.entries()].filter(([el]) => el.isConnected);
  queue.clear();
  const groups = new Set(batch.map(([, q]) => `${q.material}|${q.source}`)); // one renderer call per material + source
  for (const group of groups) {
    const [material, source] = group.split("|");
    const els = [];
    for (const [el, q] of batch) {
      if (q.material !== material || q.source !== source) continue;
      const surface = el.closest(".ds-glass");
      // Canvas anchor: the nearest [data-glass-layer] (one shared canvas for all its lenses; <body> or a sticky
      // container with no stacking context between it and the surfaces) or, by default, the surface itself.
      const shared = !!surface.closest("[data-glass-layer]");
      if (!shared && renderers() + els.length >= MAX_RENDERERS) continue; // stays on the CSS material
      surface.dataset.lens = shared ? "shared" : "self"; // anchor + stacking (css/glass.css) before the renderer measures
      surface.setAttribute("data-liquid-ignore", ""); // the control itself never appears in the refracted backdrop
      live.set(el, null);
      els.push(el);
    }
    if (!els.length) continue;
    const { px, ...opts } = preset(els[0], material);
    if (!px.bevelDepth) { els.forEach((el) => detach(el)); continue; } // tokens not loaded
    const made = liquidGL({
      target: els.map((el) => `[data-ds-lens="${el.dataset.dsLens}"]`).join(","),
      snapshot: source,
      ...opts,
      ...toUV(px, source),
      on: { init: (lens) => { if (live.has(lens.el)) lens.el.closest(".ds-glass").dataset.lensLive = ""; } },
    });
    for (const lens of [made].flat().filter(Boolean)) {
      lens._dsPx = px;
      lens._dsSource = source;
      live.set(lens.el, lens);
    }
    for (const el of els) if (!live.get(el)) detach(el);
  }
  if (live.size) watch();
}

const renderers = () => new Set([...live.values()].map((l) => l?.renderer).filter(Boolean)).size;

function detach(el) {
  const lens = live.get(el);
  live.delete(el);
  lens?.destroy();
  const surface = el.closest(".ds-glass");
  if (surface) { delete surface.dataset.lens; delete surface.dataset.lensLive; surface.removeAttribute("data-liquid-ignore"); }
}

// Lenses whose element left the DOM (closed popup, re-rendered list) release their GPU resources.
function watch() {
  if (sweeper) return;
  sweeper = new MutationObserver(() => {
    for (const el of live.keys()) if (!el.isConnected) detach(el);
    if (!live.size) { sweeper.disconnect(); sweeper = null; }
  });
  sweeper.observe(document.body, { childList: true, subtree: true });
}

// Re-snapshot when a transition ends: the renderer recaptures on DOM mutations (≈250 ms throttle), i.e. usually while
// the motion is still running, so the lens would keep a mid-motion frame. Two cases: something that carries a lens
// finished moving (a sheet slid in, a drag snapped back), or content under the lenses finished moving (a gallery slide,
// a reveal). Transitions inside a glass control (press feedback) are skipped. One debounced listener for all lenses.
let pending = null;
document.addEventListener("transitionend", (e) => {
  if (!live.size || e.target.closest?.(".ds-glass")) return;
  clearTimeout(pending);
  // Re-rasterise in idle time (≤300 ms later), so it never lands inside the next gesture or animation frame.
  pending = setTimeout(() => {
    const run = () => { pending = null; for (const r of new Set([...live.values()].map((lens) => lens?.renderer))) r?.captureSnapshot?.(); };
    if ("requestIdleCallback" in window) requestIdleCallback(run, { timeout: 300 }); else run();
  }, 60);
}, true);
