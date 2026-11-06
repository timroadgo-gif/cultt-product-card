// Button factory. Returns a <button> styled by button.css; state is switched with setButtonState().
// `icon` is a registered icon name (see ../../icons/registry.json) or SVG markup using currentColor; either way every state recolours it.
import { createIcon } from "../../icons/icon.js?v=e507ea586555";

const VARIANTS = ["primary", "secondary"];
const SIZES = ["large"];
const WIDTHS = ["hug", "fill"];
const ICON_POSITIONS = ["none", "leading", "trailing", "only"];
const STATES = ["default", "pressed", "disabled", "loading"];

const check = (name, value, allowed) => {
  if (!allowed.includes(value)) throw new Error(`Button: ${name} "${value}" is not one of ${allowed.join(" | ")}`);
};

export function createButton({
  label = "",
  variant = "primary",
  size = "large",
  width = "hug",
  iconPosition = "none",
  state = "default",
  icon = "",
  ariaLabel = "",
  type = "button",
  onClick,
} = {}) {
  check("variant", variant, VARIANTS);
  check("size", size, SIZES);
  check("width", width, WIDTHS);
  check("iconPosition", iconPosition, ICON_POSITIONS);
  if (iconPosition !== "none" && !icon) throw new Error(`Button: iconPosition "${iconPosition}" needs an icon`);
  if (iconPosition === "only" && !ariaLabel) throw new Error('Button: icon-only buttons need ariaLabel');
  if (iconPosition !== "only" && !label) throw new Error("Button: label is required unless iconPosition is only");

  const el = document.createElement("button");
  el.className = "ds-button ds-corner";
  el.type = type;
  Object.assign(el.dataset, { variant, size, width, iconPosition });
  if (ariaLabel) el.setAttribute("aria-label", ariaLabel);

  if (iconPosition !== "none") {
    const slot = document.createElement("span");
    slot.className = "ds-button__icon";
    slot.setAttribute("aria-hidden", "true");
    if (icon.trimStart().startsWith("<")) slot.innerHTML = icon;
    else slot.append(createIcon(icon));
    el.append(slot);
  }
  if (iconPosition !== "only") {
    const text = document.createElement("span");
    text.className = "ds-button__label";
    text.textContent = label;
    el.append(text);
  }
  if (onClick) el.addEventListener("click", onClick);
  setButtonState(el, state);
  return el;
}

export function setButtonState(el, state) {
  check("state", state, STATES);
  el.dataset.state = state;
  el.disabled = state === "disabled" || state === "loading";
  el.toggleAttribute("aria-busy", state === "loading");
  el.querySelector(".ds-button__spinner")?.remove();
  if (state === "loading") {
    const spinner = document.createElement("span");
    spinner.className = "ds-button__spinner";
    el.append(spinner);
  }
}
