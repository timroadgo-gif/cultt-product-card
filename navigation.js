// Prototype navigation: the public root is an index of scenarios; each scenario opens a screen by its hash route.
// Hash routes keep direct links and refresh working on static GitHub Pages without server rewrites:
//   ./            → index «Прототипы»
//   ./#/product   → product card (PDP)
// Navigation uses the History API (pushState / popstate), so Back / Forward and direct links behave like real pages.
// Transition: iOS-style push — the card enters from the right over the index, the index drifts 30 % left; pop reverses it.
// An interrupted transition reverses from where it is. Safari's own swipe-back animation (hasUAVisualTransition) is
// not doubled, and reduced motion switches screens instantly.
import { createIcon } from './design-system/icons/icon.js?v=8d19374da742';

// Scenario registry: add a row here to list another scenario. `screen` is the screen it opens (only the PDP for now).
// `state` is the product state the shared PDP renders (PRODUCT_STATES below → html[data-availability] + html[data-price];
// see app.js renderAvailability() and the «Product state» rules in styles.css).
// `sections` lists optional PDP sections the scenario adds (html[data-sections], styles.css): 'similar' = similar products.
export const PRODUCT_STATES = {
  available: { availability: 'available', price: 'current' }, // price + Split, «В корзину» + wishlist
  sold: { availability: 'sold', price: 'at-sale' }, // price + «Цена на момент продажи», «Заказать», no wishlist/Split
  soldOverThreeMonths: { availability: 'sold', price: 'hidden' }, // as sold, but no price at all: «Нет в наличии»
};
export const SCENARIOS = [
  { id: 'product', title: 'Карточка товара', route: '#/product', screen: 'product', state: 'available', documentTitle: 'Loewe Puzzle — THE CULTT' },
  { id: 'product-sold', title: 'Карточка товара — продан', route: '#/product/sold', screen: 'product', state: 'sold', documentTitle: 'Loewe Puzzle, продан — THE CULTT' },
  { id: 'product-similar', title: 'Карточка товара — похожие товары', route: '#/product/similar', screen: 'product', state: 'available', sections: ['similar'], documentTitle: 'Loewe Puzzle — THE CULTT' },
  { id: 'product-sold-3m', title: 'Продан более 3 месяцев назад', route: '#/product/sold-3m', screen: 'product', state: 'soldOverThreeMonths', documentTitle: 'Loewe Puzzle, нет в наличии — THE CULTT' },
];
const INDEX_TITLE = 'Прототипы — THE CULTT';

const PUSH = { duration: 380, easing: 'cubic-bezier(.32,.72,0,1)' };
const POP = { duration: 340, easing: 'cubic-bezier(.32,.72,0,1)' };
const UNDERLAY_SHIFT = 0.3; // the covered index moves 30 % of the width, like a native navigation stack

const root = document.documentElement;
const hub = document.getElementById('hubScreen');
const product = document.getElementById('productScreen');
const productPage = product.querySelector('.product-page');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
history.scrollRestoration = 'manual';

const scenarioFromHash = () => SCENARIOS.find(s => location.hash === s.route);

const list = document.getElementById('scenarioList');
for (const scenario of SCENARIOS) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.className = 'hub__link';
  link.href = scenario.route;
  const label = document.createElement('span');
  label.textContent = scenario.title;
  const chevron = document.createElement('span');
  chevron.className = 'hub__chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.append(createIcon('chevron-right', { size: 16 }));
  link.append(label, chevron);
  link.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; // new tab etc.
    event.preventDefault();
    history.pushState({ fromIndex: true }, '', scenario.route);
    show(scenario.screen, { scenario });
  });
  item.append(link);
  list.append(item);
}

let current = root.dataset.route; // set before first paint by the inline script in index.html
let running = null; // { product: Animation, hub: Animation }
applyScreenState();

// Product Back: return to the index. If the index is the previous history entry, go back to it (Forward keeps working);
// after a direct link there is no such entry, so the card's entry is replaced by the index (never leaves the prototype).
export function goToIndex() {
  if (history.state?.fromIndex && current === 'product') { history.back(); return; }
  history.replaceState(null, '', location.pathname + location.search);
  show('index');
}

addEventListener('popstate', event => {
  const scenario = scenarioFromHash();
  show(scenario?.screen ?? 'index', { scenario, instant: event.hasUAVisualTransition });
});

// The PDP state is set on <html> (also before first paint, index.html) and announced to app.js. Leaving the card keeps
// its state, so it slides out unchanged.
function applyScenario(scenario) {
  if (!scenario) return;
  root.dataset.sections = (scenario.sections ?? []).join(' ');
  const { availability, price } = PRODUCT_STATES[scenario.state];
  if (root.dataset.state === scenario.state) return;
  Object.assign(root.dataset, { state: scenario.state, availability, price });
  dispatchEvent(new CustomEvent('productstate', { detail: scenario.state }));
}

// Product position p: 0 = on screen, 1 = off to the right. The index sits at −UNDERLAY_SHIFT · (1 − p).
const productAt = p => `translate3d(${(p * 100).toFixed(3)}%,0,0)`;
const hubAt = p => `translate3d(${(-UNDERLAY_SHIFT * (1 - p) * 100).toFixed(3)}%,0,0)`;
const currentP = () => new DOMMatrixReadOnly(getComputedStyle(product).transform).m41 / (product.offsetWidth || 1);

function show(to, { scenario = null, instant = false } = {}) {
  if (to === 'product') applyScenario(scenario);
  if (to === current && !running) { applyScreenState(); return; }
  const from = current;
  current = to;
  let p0;
  if (running) { // interrupted: continue from the current position
    p0 = currentP();
    running.product.cancel();
    running.hub.cancel();
    running = null;
  } else {
    p0 = from === 'product' ? 0 : 1;
    // Freeze the card into a viewport-sized layer; its page keeps the current scroll inside .product-page.
    const y = from === 'product' ? scrollY : 0;
    product.classList.add('is-frozen');
    productPage.scrollTop = y;
  }
  root.dataset.route = to;
  root.classList.add('is-navigating');
  applyScreenState(); // the target screen is interactive at once: Back during a push reverses it
  if (instant || reduceMotion.matches) { settle(); return; }
  const p1 = to === 'product' ? 0 : 1;
  const timing = to === 'product' ? PUSH : POP;
  const options = { duration: Math.max(120, Math.round(timing.duration * Math.abs(p1 - p0))), easing: timing.easing, fill: 'forwards' };
  const anims = {
    product: product.animate({ transform: [productAt(p0), productAt(p1)] }, options),
    hub: hub.animate({ transform: [hubAt(p0), hubAt(p1)] }, options),
  };
  running = anims;
  anims.product.finished.then(() => { if (running === anims) settle(); }, () => {});
}

function settle() {
  if (running) { running.product.cancel(); running.hub.cancel(); running = null; }
  product.classList.remove('is-frozen');
  root.classList.remove('is-navigating');
  scrollTo(0, 0); // a pushed card always starts at the top
  dispatchEvent(new Event('scroll')); // the card's scroll-driven bar and title resync
  applyScreenState();
  // The glass engine re-snapshots after a finished transition (design-system/glass/engine.js).
  product.dispatchEvent(new Event('transitionend', { bubbles: true }));
  const focusTarget = current === 'product'
    ? product.querySelector('.gallery__topbar button[aria-label="Назад"]')
    : hub.querySelector('.hub__link');
  if (document.activeElement && document.activeElement !== document.body) focusTarget?.focus({ preventScroll: true });
}

function applyScreenState() {
  hub.inert = current !== 'index';
  product.inert = current !== 'product';
  document.title = current === 'product' ? (scenarioFromHash() ?? SCENARIOS[0]).documentTitle : INDEX_TITLE;
}
