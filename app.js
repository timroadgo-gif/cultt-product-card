// UI Kit (../IOS:UI Agent/design-system via the design-system link): icons from the approved registry, glass controls
// through GlassIconButton (live Liquid Glass engine), actions through Button. No local icon or glass implementations.
import { createIcon } from './design-system/icons/icon.js?v=35372c7d51bc';
import { createIconButton } from './design-system/components/icon-button/icon-button.js?v=35372c7d51bc';
import { createIconButtonGroup } from './design-system/components/icon-button-group/icon-button-group.js?v=35372c7d51bc';
import { createButton } from './design-system/components/button/button.js?v=35372c7d51bc';
import { goToIndex } from './navigation.js?v=35372c7d51bc';
import { renderSimilarProducts } from './similar-products.js?v=35372c7d51bc';
import { initSupport } from './support.js?v=35372c7d51bc';

renderSimilarProducts(document.getElementById('similarList'));

// Static icon slots: <span data-icon="name"> gets the registry icon; size comes from the slot's CSS (--icon-px).
// data-icon-presentation="compact" fits a small icon by its optical bounds with a legible 0.9 px line (UI Kit presentation).
document.querySelectorAll('[data-icon]').forEach(slot => {
  const presentation = slot.dataset.iconPresentation;
  const size = parseFloat(getComputedStyle(slot).getPropertyValue('--icon-px')) || 24;
  slot.append(createIcon(slot.dataset.icon, presentation ? { presentation } : { size }));
});

// Navigation over the photo (functional layer over content): Back = GlassIconButton 44; Share + Cart = one
// GlassIconButtonGroup capsule with two independent actions. Both with the large icon presentation (≈ 20 px, 1.25 px line).
document.querySelector('[data-slot="nav-leading"]').append(createIconButton({ icon: 'arrow-left', ariaLabel: 'Назад', iconSize: 'large' }));
document.querySelector('[data-slot="nav-trailing"]').append(createIconButtonGroup({
  ariaLabel: 'Действия с товаром',
  iconSize: 'large',
  items: [{ icon: 'share', ariaLabel: 'Поделиться' }, { icon: 'shopping-bag', ariaLabel: 'Корзина' }],
}));

// Bottom actions: Button primary / large / fill + Button secondary / icon-only (favourite).
const bottomBar = document.querySelector('.bottom-bar');
const bottomAdd = createButton({ label: 'В корзину', variant: 'primary', width: 'fill' });
bottomAdd.classList.add('bottom-bar__add');
const favorite = createButton({ variant: 'secondary', iconPosition: 'only', icon: 'heart', ariaLabel: 'Добавить в избранное' });
favorite.classList.add('bottom-bar__favorite');
favorite.setAttribute('aria-pressed', 'false');
bottomBar.append(bottomAdd, favorite);

// Product state comes from the scenario route (navigation.js PRODUCT_STATES → html[data-availability]: available | sold).
// Sold: primary action «Заказать» at full width, no wishlist; price caption and hidden Split are pure CSS.
const isSold = () => document.documentElement.dataset.availability === 'sold';
function renderAvailability() {
  bottomAdd.querySelector('.ds-button__label').textContent = isSold() ? 'Заказать' : 'В корзину';
  favorite.hidden = isSold();
}
renderAvailability();
addEventListener('productstate', renderAvailability);

const track = document.querySelector('#galleryTrack');
const rail = track.querySelector('.gallery__rail');
const slides = rail.querySelectorAll('.gallery__slide');
const progress = document.querySelector('#galleryProgress');
const progressBar = progress.querySelector('.gallery__progress-bar');
const galleryEl = track.closest('.gallery');
const counterCurrent = galleryEl.querySelector('.gallery__counter-current');
galleryEl.querySelector('.gallery__counter-total').textContent = String(galleryEl.querySelectorAll('.gallery__slide').length);
const toast = document.querySelector('#toast');
let toastTimer;
let galleryIndex = 0;
let lastWheelSlide = 0;
const topbar = document.querySelector('.gallery__topbar');


// The gallery is pinned under the content, so the bar turns solid when the white surface reaches it.
const productContent = document.querySelector('.product-content');
// Compact title: mirrors the product name and follows the REAL title's position. p = 0 while the title's top is at or
// below the bar's lower edge, 1 once it has travelled TITLE_RANGE px under the bar; anything between is shown as is.
const productTitle = document.querySelector('#productName');
const compactTitle = document.querySelector('.gallery__topbar-title');
const TITLE_RANGE = 32;
const syncTitleText = () => { compactTitle.textContent = productTitle.textContent.trim(); };
syncTitleText();
new MutationObserver(syncTitleText).observe(productTitle, { childList: true, characterData: true, subtree: true });
let lastTitleP = -1;
function updateCompactTitle() {
  const barBottom = topbar.getBoundingClientRect().bottom;
  const p = Math.min(1, Math.max(0, (barBottom - productTitle.getBoundingClientRect().top) / TITLE_RANGE));
  if (Math.abs(p - lastTitleP) < 0.001) return;
  lastTitleP = p;
  compactTitle.style.setProperty('--title-p', p.toFixed(3));
}

function updateTopbar() {
  updateCompactTitle();
  const solid = productContent.getBoundingClientRect().top <= topbar.offsetHeight;
  topbar.classList.toggle('is-scrolled', solid);
  // Over the solid bar the glass buttons refract the bar, not the page under it (UI Kit: data-glass-backdrop).
  if (solid) topbar.dataset.glassBackdrop = 'solid';
  else delete topbar.dataset.glassBackdrop;
}

window.addEventListener('scroll', updateTopbar, { passive: true });
window.addEventListener('resize', updateTopbar);
updateTopbar();

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

initSupport({ screen: document.getElementById('productScreen'), notify: showToast });

// Gallery: one position value (in slides, fractional while dragging) drives the rail and the progress bar together.
// Pointer events track the finger 1:1; the browser keeps vertical scrolling (touch-action: pan-y on the track), and a
// gesture is claimed only once it is clearly horizontal. Release settles with a duration matched to the finger's speed.
const count = slides.length;
galleryEl.style.setProperty('--gallery-count', count);
let position = 0; // current visual position, in slides
let drag = null;
const reduceGalleryMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Reveal transition (Zara-style video ref): the incoming photo does not travel — it stays where it will rest and is
// uncovered by its own leading edge, so it seems to pull out from the side over the current one. The photo being covered
// drifts away at GALLERY_DRIFT of the finger's speed. Each image is shifted inside its own clipped slide while the rail
// moves 1:1, so the edge between them is always a clean cut. Linear in position, so the settle transition keeps it in sync.
const GALLERY_DRIFT = 0.25;
const slideImages = [...slides].map(slide => slide.querySelector('img'));
// A photo that fails to load on a flaky mobile connection must never show Safari's broken-image icon and alt text:
// hide it (the slide's neutral background stays) and retry with a cache-busting query, also when the network returns.
slideImages.forEach(img => {
  const base = img.getAttribute('src');
  let tries = 0;
  const retry = () => { if (img.classList.contains('is-broken')) img.src = `${base}${base.includes('?') ? '&' : '?'}retry=${++tries}`; };
  img.addEventListener('load', () => img.classList.remove('is-broken'));
  img.addEventListener('error', () => {
    img.classList.add('is-broken');
    if (tries < 5) setTimeout(retry, 400 * 2 ** tries);
  });
  addEventListener('online', retry);
  if (img.complete && !img.naturalWidth && img.currentSrc) img.dispatchEvent(new Event('error'));
});

function paintGallery(pos) {
  position = pos;
  rail.style.transform = `translate3d(${-pos * 100}%, 0, 0)`;
  slideImages.forEach((img, i) => {
    const d = Math.min(1, Math.max(-1, i - pos)); // >0 coming in, <0 being covered, 0 at rest
    const shift = d > 0 ? -d : -d * (1 - GALLERY_DRIFT); // incoming: hold still on screen; covered: drift slowly
    img.style.transform = d ? `translate3d(${(shift * 100).toFixed(3)}%, 0, 0)` : '';
  });
  counterCurrent.textContent = String(Math.min(count, Math.max(1, Math.round(pos) + 1))); // the photo that covers most of the frame
  progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, (pos + 1) / count))})`; // cumulative, left-anchored
}

function settleGallery(index, duration = 420) {
  galleryIndex = Math.max(0, Math.min(index, count - 1));
  galleryEl.style.setProperty('--gallery-settle', `${reduceGalleryMotion.matches ? 0 : Math.round(duration)}ms`);
  galleryEl.classList.add('is-settling');
  paintGallery(galleryIndex);
  progress.setAttribute('aria-label', `Фото ${galleryIndex + 1} из ${count}`);
}
const showGallerySlide = index => settleGallery(index);
rail.addEventListener('transitionend', event => { if (event.target === rail) galleryEl.classList.remove('is-settling'); });

// Where the rail is right now (mid-settle included), so grabbing a moving photo continues from where it is.
function currentPosition() {
  const m = new DOMMatrixReadOnly(getComputedStyle(rail).transform);
  return -m.m41 / (track.clientWidth || 1);
}

track.addEventListener('pointerdown', event => {
  if (event.button > 0 || drag) return;
  const pos = galleryEl.classList.contains('is-settling') ? currentPosition() : position;
  drag = { id: event.pointerId, x0: event.clientX, y0: event.clientY, start: pos, width: track.clientWidth, axis: null, samples: [[event.timeStamp, event.clientX]] };
});

track.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x0, dy = event.clientY - drag.y0;
  if (!drag.axis) {
    if (Math.hypot(dx, dy) < 6) return;
    drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (drag.axis === 'y') { drag = null; return; } // vertical: leave it to page scrolling
    track.setPointerCapture(event.pointerId);
    galleryEl.classList.remove('is-settling');
    paintGallery(drag.start);
  }
  drag.samples.push([event.timeStamp, event.clientX]);
  if (drag.samples.length > 6) drag.samples.shift();
  let pos = drag.start - dx / drag.width;
  if (pos < 0) pos *= 0.35; // soft edges instead of a hard stop; no looping
  else if (pos > count - 1) pos = count - 1 + (pos - (count - 1)) * 0.35;
  paintGallery(pos);
});

function endDrag(event) {
  if (!drag || event.pointerId !== drag.id) return;
  const d = drag; drag = null;
  if (d.axis !== 'x') return;
  const [t0, x0] = d.samples[0], [t1, x1] = d.samples[d.samples.length - 1];
  const velocity = (x1 - x0) / Math.max(16, t1 - t0); // px per ms, positive = finger moving right
  let target = Math.round(position);
  if (Math.abs(velocity) > 0.3) target = velocity < 0 ? Math.ceil(position - 0.02) : Math.floor(position + 0.02); // a flick goes one photo in its direction
  target = Math.max(d.start - 1, Math.min(d.start + 1, target)); // one photo per gesture
  const remaining = Math.abs(target - position) * d.width;
  // Settle as fast as the finger was moving (ease-out starts at ~2.4× average speed), never jumpier than 220 ms or slower than 420.
  const duration = Math.abs(velocity) > 0.05 ? Math.min(420, Math.max(220, (remaining / Math.abs(velocity)) * 1.6)) : 420;
  settleGallery(Math.round(target), event.type === 'pointercancel' ? 300 : duration);
}
track.addEventListener('pointerup', endDrag);
track.addEventListener('pointercancel', endDrag);
track.addEventListener('dragstart', event => event.preventDefault());

track.addEventListener('wheel', event => {
  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
  event.preventDefault();
  if (Date.now() - lastWheelSlide < 450 || Math.abs(event.deltaX) < 15) return;
  showGallerySlide(galleryIndex + (event.deltaX > 0 ? 1 : -1));
  lastWheelSlide = Date.now();
}, { passive: false });

// Decode every photo up front so the first swipe never waits on image decoding.
slides.forEach(slide => slide.querySelector('img')?.decode?.().catch(() => {}));

// Article: the whole row is one button. The check appears only after the clipboard write succeeds, stays 1.5 s;
// a repeated tap copies again and restarts the timer. A failed write keeps the copy icon and shows the number in the toast.
const skuCopy = document.querySelector('.sku-copy');
const skuStatus = document.getElementById('skuCopyStatus');
let skuTimer = 0;
skuCopy.addEventListener('click', async () => {
  const value = skuCopy.querySelector('.sku-copy__value').textContent.trim();
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(value);
  } catch {
    clearTimeout(skuTimer);
    skuCopy.classList.remove('is-copied');
    showToast(`Не удалось скопировать. Артикул: ${value}`);
    return;
  }
  clearTimeout(skuTimer);
  skuCopy.classList.add('is-copied');
  skuStatus.textContent = '';
  requestAnimationFrame(() => { skuStatus.textContent = 'Артикул скопирован'; }); // re-announced on every copy
  skuTimer = setTimeout(() => { skuCopy.classList.remove('is-copied'); skuStatus.textContent = ''; }, 1500);
});

// Back always returns to the prototype index (reverse push), also when the card was opened by a direct link.
document.querySelector('.gallery__topbar button[aria-label="Назад"]').addEventListener('click', goToIndex);

document.querySelector('.gallery__topbar button[aria-label="Поделиться"]').addEventListener('click', async () => {
  const shareData = { title: 'Loewe Puzzle — THE CULTT', url: location.href };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch { /* user dismissed the share sheet */ }
  } else if (navigator.clipboard) {
    try { await navigator.clipboard.writeText(location.href); showToast('Ссылка скопирована'); }
    catch { showToast('Loewe Puzzle'); }
  } else showToast('Loewe Puzzle');
});

document.querySelector('.gallery__topbar button[aria-label="Корзина"]').addEventListener('click', () => showToast('Товар добавлен в корзину'));
bottomAdd.addEventListener('click', () => { if (!isSold()) showToast('Товар добавлен в корзину'); }); // sold: no order flow yet
document.querySelectorAll('.info-button').forEach(button => button.addEventListener('click', () => {
  showToast(button.getAttribute('aria-label'));
}));
document.querySelector('.delivery-manager').addEventListener('click', event => {
  event.preventDefault();
  showToast(event.currentTarget.textContent);
});
// Category → catalogue (not part of this prototype yet): stay on the card and say where it leads.
document.querySelector('.product-category').addEventListener('click', event => {
  event.preventDefault();
  showToast('Каталог: Сумка с ручками');
});
document.querySelector('.city-link').addEventListener('click', () => showToast('Доступна доставка по Москве'));
document.querySelector('.delivery-options .text-link').addEventListener('click', () => {
  document.querySelector('.accordion summary').scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('Примерка в бутике и самовывоз');
});
document.querySelectorAll('.capacity-item__image img').forEach(img => img.addEventListener('error', () => { img.hidden = true; }));
document.querySelectorAll('.favorite-button, .bottom-bar__favorite').forEach(button => button.addEventListener('click', () => {
  const saved = button.classList.toggle('is-saved');
  button.querySelector('.ds-button__icon')?.replaceChildren(createIcon(saved ? 'heart-filled' : 'heart'));
  button.setAttribute('aria-pressed', String(saved));
  button.setAttribute('aria-label', saved ? 'Убрать из избранного' : 'Добавить в избранное');
  showToast(saved ? 'Добавлено в избранное' : 'Удалено из избранного');
}));

// Accordions (LV reference, frame-by-frame): the row first opens empty space — the real height of the body is animated,
// so every section below moves with the layout — and the content fades in (6 px rise) over the second half. Closing
// fades the content while the space collapses under it, clipped from the bottom. A tap mid-animation reverses from the
// current height and opacity. Native <details>/<summary> keep the semantics (expanded state, keyboard).
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const ACC = {
  // Responsive start (the panel moves from the first frame after the tap), short soft finish, no overshoot.
  open: { duration: 300, easing: 'cubic-bezier(.2,.3,.25,1)' },
  close: { duration: 250, easing: 'cubic-bezier(.3,.2,.3,1)' },
};
document.querySelectorAll('.accordion').forEach(details => {
  const summary = details.querySelector('summary');
  const body = details.querySelector('.accordion__body');
  const content = body.firstElementChild;
  let anims = [];
  details.classList.toggle('is-expanded', details.open);
  details.classList.add('is-managed');
  summary.setAttribute('aria-expanded', String(details.open));
  details.addEventListener('toggle', () => {
    if (!anims.length) details.classList.toggle('is-expanded', details.open);
  });
  summary.addEventListener('click', event => {
    event.preventDefault();
    const expand = !details.classList.contains('is-expanded');
    // Current state, mid-animation included, before anything is cancelled.
    const fromH = details.open ? body.getBoundingClientRect().height : 0;
    const fromO = details.open ? Number(getComputedStyle(content).opacity) : 0;
    anims.forEach(a => a.cancel());
    anims = [];
    details.classList.toggle('is-expanded', expand);
    summary.setAttribute('aria-expanded', String(expand));
    if (reduceMotion.matches) { details.open = expand; return; }
    details.open = true;
    const toH = expand ? body.scrollHeight : 0;
    const share = expand ? Math.max(0.3, Math.abs(toH - fromH) / (toH || 1)) : Math.max(0.3, fromH / (body.scrollHeight || 1));
    const timing = expand ? ACC.open : ACC.close;
    const duration = Math.round(timing.duration * share); // a reversal travels only the remaining distance
    body.style.overflow = 'hidden';
    const height = body.animate({ height: [`${fromH}px`, `${toH}px`] }, { duration, easing: timing.easing, fill: 'forwards' });
    const fade = expand
      ? content.animate({ opacity: [fromO, 1], transform: [`translateY(${6 * (1 - fromO)}px)`, 'translateY(0)'] }, { duration: Math.round(200 * Math.max(0.4, 1 - fromO)), delay: fromO > 0 ? 0 : Math.round(duration * 0.25), easing: 'cubic-bezier(.2,0,.2,1)', fill: 'both' })
      : content.animate({ opacity: [fromO, 0] }, { duration: Math.round(duration * 0.7), easing: 'cubic-bezier(.4,0,1,1)', fill: 'both' });
    anims = [height, fade];
    height.onfinish = () => {
      if (anims[0] !== height) return;
      if (!expand) details.open = false; // close before releasing the held 0 px height, so nothing flashes
      body.style.overflow = '';
      anims.forEach(a => a.cancel());
      anims = [];
    };
  });
});
