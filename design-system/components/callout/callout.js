// Callout factory. createCallout({ text }) → <p>.
export function createCallout({ text } = {}) {
  if (!text) throw new Error("Callout: text is required");
  return Object.assign(document.createElement("p"), { className: "ds-callout ds-corner ds-text-body-s", textContent: text });
}
