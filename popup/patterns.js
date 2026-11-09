// Popup interaction categories → dismissal control and policy (approved 2026-11-02). Three separate concerns:
//   content      — information / confirmation / form (what the popup says; documented per popup)
//   presentation — compact floating card or full bottom sheet; chosen by the host from the content itself
//                  (any form control — one is enough → full; otherwise natural height > 50 % of the screen → full),
//                  never set per popup and never derived from the category below
//   dismissal    — this table, by interaction complexity:
//     simple — information, alerts, confirmations, one simple field or toggle. Drag indicator, no close button;
//              dismissed by swipe, backdrop, Escape or its own actions; a keyboard / screen-reader close button
//              appears only while it has keyboard focus.
//     form   — substantial multi-field input with data to lose. Top-right glass close button in its own row,
//              heading below it, 56 at the bottom; no drag indicator (swipe still works and is guarded).
// `guard`: once the user has changed a field, X / swipe / backdrop / Escape ask before discarding it (alert below);
// the popup's own buttons (Continue, "without e-mail", links) close directly — they are deliberate choices.
// A popup with no fields is never guarded in practice (nothing can change). A popup may pass its own `dismiss`
// to override a row, with a comment explaining why.
export const CATEGORIES = {
  simple: { closeButton: false, indicator: true, swipe: true, backdrop: true, escape: true, guard: true },
  form: { closeButton: true, indicator: false, swipe: true, backdrop: true, escape: true, guard: true },
};

// Discard confirmation (design-system Alert). Copy is a draft pending approval.
export const DISCARD_ALERT = {
  heading: "Закрыть без сохранения?",
  message: "Введённые данные не сохранятся.",
  confirm: "Закрыть",
  cancel: "Отмена",
};

export function dismissPolicy(variant) {
  const base = CATEGORIES[variant.category];
  if (!base) throw new Error(`Popup "${variant.id}": category "${variant.category}" is not one of ${Object.keys(CATEGORIES).join(" | ")}`);
  return { ...base, ...variant.dismiss };
}
