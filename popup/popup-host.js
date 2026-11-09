// Popup host: one popup at a time. Variants supply content and a category (js/patterns.js → layout + dismissal); the host owns
// backdrop, motion, focus, inert background, swipe-to-dismiss and state reset (DOM is rebuilt per open).
// Guarded patterns (form): X / swipe / backdrop / Escape on a changed form open the discard Alert instead of closing.

import { createIconButton } from "../design-system/components/icon-button/icon-button.js?v=3f600cc80bc5";
import { createModalBackdrop, openBackdrop, closeBackdrop } from "../design-system/backdrop/backdrop.js?v=3f600cc80bc5";
import { createAlert } from "../design-system/components/alert/alert.js?v=3f600cc80bc5";
import { createDragIndicator } from "../design-system/components/drag-indicator/drag-indicator.js?v=3f600cc80bc5";
import { dismissPolicy, DISCARD_ALERT } from "./patterns.js?v=3f600cc80bc5";

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)");
const FOCUSABLE = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
const SWIPE_KINDS = new Set(["sheet"]);
const FULL_SHEET_RATIO = 0.5; // popups without form controls: natural height above half the screen → full sheet
// Data-entry controls (not action buttons): one is enough to make the popup a full bottom sheet — no field count,
// no length rule. Button-type inputs are actions, not data entry.
const FORM_CONTROLS = [
  'input:not([type="hidden"],[type="button"],[type="submit"],[type="reset"],[type="image"])',
  "textarea", "select", "[contenteditable]:not([contenteditable=\"false\"])",
  '[role="textbox"]', '[role="checkbox"]', '[role="switch"]', '[role="radio"]', '[role="slider"]', '[role="spinbutton"]',
  '[role="combobox"]', '[role="listbox"]', '[aria-haspopup="listbox"]',
].join(",");

const FIELDS = "input,textarea,select";

const el = (cls) => Object.assign(document.createElement("div"), { className: cls });
// Form state for the discard guard: every field's value / checked flag, in DOM order.
const snapshot = (root) => JSON.stringify([...root.querySelectorAll(FIELDS)].map((f) => (f.type === "checkbox" || f.type === "radio" ? f.checked : f.value)));

// Close control = shared IconButton / Glass / Light, compact: secondary 32 glass circle, 44 × 44 hit area.
// refraction: false for the focus-only X — it is not painted until focused, so it holds no GPU lens.
export function glassCloseButton(onClick, { refraction = true } = {}) {
  return createIconButton({ icon: "close", ariaLabel: "Закрыть", size: "compact", refraction, onClick });
}

let surfaceSeq = 0;

export function createHost({ layer, background, getScale = () => 1 }) {
  let cur = null;

  function open(variant, trigger) {
    if (cur) return;
    const dismiss = dismissPolicy(variant);
    const root = el(`popup popup--${variant.kind} popup--${variant.category}`);
    const panel = el("popup__panel ds-corner");
    const scroll = el("popup__scroll");
    const ctx = { close: () => close() };
    // Gestures and the X go through dismissRequest (may ask first); the popup's own buttons use ctx.close.
    const dismissRequest = () => requestDismiss();
    // Shared ModalBackdrop; the artboard is an iPhone, so mobile values regardless of the desktop viewport.
    const backdrop = createModalBackdrop({ scope: "container", container: layer, platform: "mobile", onDismiss: dismiss.backdrop ? dismissRequest : undefined });

    panel.setAttribute("role", variant.role || "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", variant.title);
    panel.tabIndex = -1;
    scroll.append(variant.render(ctx));
    panel.append(scroll);
    // Glass controls refract the popup's own content, not the page: the snapshot rasteriser does not support
    // corner-shape, so a page snapshot draws the panel's continuous top corners as a much larger circular radius and
    // the close/back lenses near them bent the dimmed page "outside" that circle into their rims. The scroll area has
    // no corner of its own, so the lens only ever sees the white surface it sits on (docs/glass.md → pinned source).
    scroll.id = `popup-surface-${++surfaceSeq}`;
    panel.dataset.glassSource = `#${scroll.id}`;
    // Close button (form): in the header's own top-trailing control row above the heading ([data-close-slot]).
    // Simple: the row is removed with its wrapper, so no space is left above the heading; a close button for
    // keyboard and screen-reader users floats top-trailing and is shown only while it has keyboard focus.
    const slot = scroll.querySelector("[data-close-slot]");
    if (dismiss.closeButton && slot) {
      slot.append(glassCloseButton(dismissRequest));
    } else {
      const header = slot?.closest(".ps__header");
      slot?.remove();
      header?.replaceWith(...header.childNodes);
      const bar = el(`popup__toolbar${dismiss.closeButton ? "" : " popup__toolbar--focus-only"}`);
      bar.append(glassCloseButton(dismissRequest, { refraction: dismiss.closeButton }));
      panel.append(bar);
    }
    // Simple interactions: drag indicator, centred at the top inside the top padding; it marks the real swipe gesture.
    if (dismiss.indicator && dismiss.swipe && SWIPE_KINDS.has(variant.kind)) {
      const grab = createDragIndicator();
      grab.classList.add("popup__grabber");
      panel.append(grab);
    }
    root.append(backdrop, panel);
    layer.append(root);
    // Presentation (separate from the category and from dismissal): a form control → always a full sheet, whatever the
    // field count or content length. No form control → compact floating card, unless the panel's natural height
    // (measured unconstrained at the compact width) exceeds half the screen — the approved rule for long content.
    // Decided once per open against the popup layer (the screen, not the visual viewport), so the keyboard opening
    // later never switches the mode.
    const hasForm = !!scroll.querySelector(FORM_CONTROLS);
    let full = hasForm;
    // Opt-in exception (variant.presentation === "compact", no form controls): always the floating card, whatever its
    // height; it scrolls inside within the screen limit. Used where an approved reference is an island (product card
    // «Связаться с нами», Louis Vuitton «Contact Us», user decision 2026-11-09). Every other popup: rule above.
    if (!hasForm && variant.presentation === "compact") full = false;
    else if (!hasForm) {
      panel.style.maxHeight = "none";
      full = panel.offsetHeight > layer.offsetHeight * FULL_SHEET_RATIO;
      panel.style.maxHeight = "";
    }
    root.classList.add(full ? "popup--full" : "popup--compact");
    if (full) panel.dataset.cornerEdges = "top";
    background.forEach((n) => (n.inert = true));

    cur = { root, backdrop, panel, scroll, variant, trigger, dismiss, initial: snapshot(scroll), alert: null, closing: false };
    root.addEventListener("keydown", (e) => onKey(e, dismiss));
    if (dismiss.swipe && SWIPE_KINDS.has(variant.kind)) attachSwipe(cur);

    // Split layout: content that marks its own scroll region(s) with [data-popup-scroll] keeps a fixed header
    // (controls, heading, search) and scrolls only that region; the shell itself never scrolls, so the X, the
    // heading and the panel's corners stay put (css/popup.css). Otherwise the whole content scrolls as before.
    if (scroll.querySelector("[data-popup-scroll]")) scroll.classList.add("popup__scroll--split");
    // Allow native scroll only when content overflows; otherwise the whole panel is a drag handle.
    else if (scroll.scrollHeight > scroll.clientHeight) scroll.style.touchAction = "pan-y";
    // Virtual keyboard (iOS Safari keeps the layout viewport, so fixed content ends up under the keyboard):
    // expose its height as --popup-keyboard so scroll regions can pad their end and stay reachable.
    const vv = window.visualViewport;
    const onViewport = () => layer.style.setProperty("--popup-keyboard", `${Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop))}px`);
    if (vv) { vv.addEventListener("resize", onViewport); vv.addEventListener("scroll", onViewport); onViewport(); }
    cur.offViewport = () => { if (vv) { vv.removeEventListener("resize", onViewport); vv.removeEventListener("scroll", onViewport); } layer.style.removeProperty("--popup-keyboard"); };

    openBackdrop(backdrop);
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("is-open")));
    panel.focus({ preventScroll: true });
    variant.onOpen?.(ctx);
  }

  // X, swipe, backdrop, Escape: close, unless a guarded form has been changed — then confirm first.
  function requestDismiss() {
    if (!cur || cur.closing || cur.alert) return;
    if (cur.dismiss.guard && snapshot(cur.scroll) !== cur.initial) return openDiscardAlert();
    close();
  }

  // Discard confirmation over the sheet: nested ModalBackdrop (no extra dimming, no tap-to-dismiss), sheet inert,
  // focus on Cancel, Escape = Cancel. Confirm closes the sheet; Cancel returns focus to where it was.
  function openDiscardAlert() {
    const c = cur;
    const returnFocus = document.activeElement;
    const wrap = el("popup__alert");
    const backdrop = createModalBackdrop({ scope: "container", container: layer, platform: "mobile" });
    const card = createAlert({
      heading: DISCARD_ALERT.heading,
      message: DISCARD_ALERT.message,
      confirm: { label: DISCARD_ALERT.confirm, onClick: () => close() },
      cancel: { label: DISCARD_ALERT.cancel, onClick: () => closeDiscardAlert(returnFocus) },
    });
    wrap.append(backdrop, card);
    c.root.append(wrap);
    c.panel.inert = true;
    c.alert = { wrap, backdrop, card };
    openBackdrop(backdrop);
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add("is-open")));
    card.querySelector("[data-alert-cancel]").focus({ preventScroll: true, focusVisible: false }); // ring only on keyboard navigation
  }

  function closeDiscardAlert(returnFocus) {
    const a = cur?.alert;
    if (!a) return;
    cur.alert = null;
    closeBackdrop(a.backdrop);
    a.wrap.classList.remove("is-open");
    setTimeout(() => a.wrap.remove(), REDUCED.matches ? 150 : 250);
    cur.panel.inert = false;
    (returnFocus && cur.panel.contains(returnFocus) ? returnFocus : cur.panel).focus({ preventScroll: true });
  }

  function close() {
    if (!cur || cur.closing) return;
    const c = cur;
    c.closing = true;
    if (c.alert) {
      closeBackdrop(c.alert.backdrop);
      c.alert.wrap.classList.remove("is-open");
    }
    c.panel.classList.remove("is-dragging");
    c.panel.style.transform = "";
    closeBackdrop(c.backdrop);
    c.root.classList.remove("is-open");
    c.root.classList.add("is-closing");

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      c.root.remove();
      c.offViewport?.();
      background.forEach((n) => (n.inert = false));
      c.trigger?.focus({ preventScroll: true });
      cur = null;
      c.variant.onClose?.();
    };
    c.panel.addEventListener("transitionend", (e) => e.target === c.panel && finish());
    setTimeout(finish, REDUCED.matches ? 250 : 500);
  }

  function onKey(e, dismiss) {
    if (e.key === "Escape" && cur.alert) return closeDiscardAlert(); // Escape = Cancel
    if (e.key === "Escape" && dismiss.escape) return requestDismiss();
    if (e.key !== "Tab") return;
    const trap = cur.alert?.card ?? cur.panel;
    const items = [...trap.querySelectorAll(FOCUSABLE)];
    if (!items.length) return e.preventDefault();
    const first = items[0], last = items.at(-1);
    if (e.shiftKey && (document.activeElement === first || document.activeElement === trap)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function attachSwipe(c) {
    const { panel, backdrop, scroll } = c;
    let startY = 0, dy = 0, lastY = 0, lastT = 0, v = 0, active = false;

    panel.addEventListener("pointerdown", (e) => {
      if (c.closing || e.button > 0 || e.target.closest("button,a,input,textarea,select")) return;
      if ((e.target.closest?.("[data-popup-scroll]") ?? scroll).scrollTop > 0) return; // list not at its top: let it scroll
      active = true;
      startY = lastY = e.clientY;
      lastT = e.timeStamp;
      dy = v = 0;
      panel.setPointerCapture(e.pointerId);
      panel.classList.add("is-dragging");
    });
    panel.addEventListener("pointermove", (e) => {
      if (!active) return;
      const raw = (e.clientY - startY) / getScale();
      dy = raw < 0 ? raw * 0.12 : raw; // slight resistance upward
      v = (e.clientY - lastY) / Math.max(1, e.timeStamp - lastT) / getScale();
      lastY = e.clientY;
      lastT = e.timeStamp;
      panel.style.transform = `translateY(${dy}px)`;
      backdrop.style.opacity = String(Math.max(0.2, 1 - Math.max(0, dy) / (panel.offsetHeight * 1.2)));
    });
    const end = () => {
      if (!active) return;
      active = false;
      const dismissed = dy > Math.min(120, panel.offsetHeight * 0.3) || v > 0.6;
      const guarded = dismissed && c.dismiss.guard && snapshot(scroll) !== c.initial;
      if (dismissed && !guarded) return close();
      panel.classList.remove("is-dragging"); // snap back; a changed form asks before closing
      panel.style.transform = "";
      backdrop.style.opacity = "";
      if (guarded) openDiscardAlert();
    };
    panel.addEventListener("pointerup", end);
    panel.addEventListener("pointercancel", end);
  }

  return { open, close };
}
