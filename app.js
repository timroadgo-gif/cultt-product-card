// UI Kit (../IOS:UI Agent/design-system via the design-system link): icons from the approved registry, glass controls
// through GlassIconButton (live Liquid Glass engine), actions through Button. No local icon or glass implementations.
import { createIcon, applyPresentation } from './design-system/icons/icon.js?v=01efc74b338a';
import { META as ICON_META } from './design-system/icons/icons.generated.js?v=01efc74b338a';
import { createIconButton } from './design-system/components/icon-button/icon-button.js?v=01efc74b338a';
import { createIconButtonGroup } from './design-system/components/icon-button-group/icon-button-group.js?v=01efc74b338a';
import { createButton } from './design-system/components/button/button.js?v=01efc74b338a';
import { createGalleryPager } from './design-system/components/gallery-pager/gallery-pager.js?v=01efc74b338a';
import { goToIndex } from './navigation.js?v=01efc74b338a';
import { renderSimilarProducts } from './similar-products.js?v=01efc74b338a';
import { initSupport } from './support.js?v=01efc74b338a';
import { initCostPerWear } from './cost-per-wear.js?v=01efc74b338a';
import { createPagePopups } from './popups.js?v=01efc74b338a';

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
const backButton = createIconButton({ icon: 'arrow-left', ariaLabel: 'Назад', iconSize: 'large' });
// Optical balance (2026-11-10 refinement): the registry's ×1.15 arrow correction is meant for the compact presentation
// (a thin arrow next to chevrons). In the large top-bar presentation it made Back 16.2 px wide next to Share 14.1 and
// Cart 11.6 × 14.9, so it read larger. Re-fit the same UI Kit icon with the same presentation, without that factor:
// ≈ 14.2 px wide, line unchanged (0.9 px). Paths and the UI Kit registry stay untouched.
applyPresentation(backButton.querySelector('svg'), { ...ICON_META['arrow-left'], compact: { ...ICON_META['arrow-left'].compact, scale: 1 } }, 'large');
document.querySelector('[data-slot="nav-leading"]').append(backButton);
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
const slides = [...rail.querySelectorAll('.gallery__slide')]; // the unique photos (loop clones are added later)
const pager = document.querySelector('#galleryPager');
const galleryEl = track.closest('.gallery');
const counterCurrent = galleryEl.querySelector('.gallery__counter-current');
galleryEl.querySelector('.gallery__counter-total').textContent = String(slides.length);
const toast = document.querySelector('#toast');
let toastTimer;
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

const popups = createPagePopups(document.getElementById('productScreen'));
initSupport({ screen: document.getElementById('productScreen'), popups, notify: showToast });
initCostPerWear({ popups });

// Gallery (2026-11-12): native horizontal scrolling with CSS scroll snapping — the photos move with the finger and the
// browser's own momentum settles on a photo (scroll-snap-stop: always → one photo per swipe, velocity-aware). No custom
// animation. Infinite loop: one clone of the last photo before the first and one of the first after the last; when the
// scroll settles on a clone, scrollLeft jumps to the identical real photo (same pixels, so the jump is invisible).
// The DOM never grows. One photo: no clones, no paging. Pagination = one flat segment per unique photo.
const count = slides.length;
galleryEl.style.setProperty('--gallery-count', count);
const looping = count > 1;
if (looping) {
  const clone = (slide, where) => {
    const c = slide.cloneNode(true);
    c.classList.add('gallery__slide--clone');
    c.setAttribute('aria-hidden', 'true');
    c.querySelector('img')?.setAttribute('alt', '');
    c.querySelector('img')?.removeAttribute('decoding');
    rail[where](c);
  };
  clone(slides[count - 1], 'prepend');
  clone(slides[0], 'append');
}
galleryEl.classList.toggle('is-single', !looping);
const offset = looping ? 1 : 0; // DOM position of photo 0
const allImages = [...rail.querySelectorAll('img')];

// A photo that fails to load on a flaky mobile connection must never show Safari's broken-image icon and alt text:
// hide it (the slide's neutral background stays) and retry with a cache-busting query, also when the network returns.
allImages.forEach(img => {
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

// Pagination: UI Kit GalleryPager (design-system/components/gallery-pager — approved motion, spec.md). This page only
// positions it (.gallery__pager) and feeds it the scroll position; segments, morph and accessible name live in the kit.
const galleryPager = createGalleryPager({ count });
galleryPager.classList.add('gallery__pager');
galleryPager.id = 'galleryPager';
pager.replaceWith(galleryPager);
const paintPager = progress => galleryPager.setProgress(progress);

let galleryIndex = 0;
function setActive(index) { // settled photo: counter (the pager paints itself from the scroll position)
  galleryIndex = index;
  counterCurrent.textContent = String(index + 1);
}

const slideWidth = () => track.clientWidth || 1;
const jumpTo = domIndex => {
  // Instant, snap-aligned jump (no smooth behaviour inherited from CSS).
  track.style.scrollBehavior = 'auto';
  track.scrollLeft = domIndex * slideWidth();
  track.style.scrollBehavior = '';
};
jumpTo(offset);
setActive(0);

// Settled: map the DOM position to a photo, wrap off the clones, refresh the glass lenses' snapshot of the photo.
let touching = false;
function onSettled() {
  if (touching) return; // still under the finger: wait for the release
  const dom = Math.round(track.scrollLeft / slideWidth());
  if (Math.abs(track.scrollLeft - dom * slideWidth()) > 1) return; // not aligned yet (snap still running)
  let index = dom - offset;
  if (looping && index < 0) { index = count - 1; jumpTo(count - 1 + offset); }
  else if (looping && index > count - 1) { index = 0; jumpTo(offset); }
  if (index !== galleryIndex) setActive(index);
  // The glass engine re-captures on transitionend; native scrolling fires none, so announce the settled frame.
  galleryEl.dispatchEvent(new Event('transitionend', { bubbles: true }));
}
let settleTimer = 0;
const scheduleSettle = () => { clearTimeout(settleTimer); settleTimer = setTimeout(onSettled, 140); };
track.addEventListener('scroll', scheduleSettle, { passive: true }); // fallback where scrollend is missing
// Pagination follows the scroll every frame (finger, momentum, snap and the invisible loop jump alike).
let pagerFrame = 0;
const pagerFromScroll = () => { pagerFrame = 0; paintPager(track.scrollLeft / slideWidth() - offset); };
if (looping) {
  track.addEventListener('scroll', () => { if (!pagerFrame) pagerFrame = requestAnimationFrame(pagerFromScroll); }, { passive: true });
  pagerFromScroll();
}
track.addEventListener('scrollend', () => { clearTimeout(settleTimer); onSettled(); });
track.addEventListener('touchstart', () => { touching = true; }, { passive: true });
const release = () => { touching = false; scheduleSettle(); };
track.addEventListener('touchend', release, { passive: true });
track.addEventListener('touchcancel', release, { passive: true });
// Keep the current photo aligned when the frame changes width (rotation, desktop resize).
new ResizeObserver(() => jumpTo(galleryIndex + offset)).observe(track);

// Desktop mouse: drag the photos like a finger (native scrolling has no mouse drag); release snaps to the nearest
// photo in the drag direction with the browser's smooth scroll. Touch and trackpad use pure native scrolling.
let mouseDrag = null;
track.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse' || event.button !== 0 || !looping) return;
  mouseDrag = { x: event.clientX, left: track.scrollLeft, moved: false };
  track.setPointerCapture(event.pointerId);
});
track.addEventListener('pointermove', event => {
  if (!mouseDrag) return;
  if (event.buttons === 0) { endMouseDrag(event); return; }
  const dx = event.clientX - mouseDrag.x;
  if (!mouseDrag.moved && Math.abs(dx) < 4) return;
  if (!mouseDrag.moved) { mouseDrag.moved = true; galleryEl.classList.add('is-mouse-dragging'); }
  track.scrollLeft = mouseDrag.left - dx;
});
function endMouseDrag(event) {
  if (!mouseDrag) return;
  const d = mouseDrag; mouseDrag = null;
  galleryEl.classList.remove('is-mouse-dragging');
  if (!d.moved) return;
  const start = Math.round(d.left / slideWidth()), dx = event.clientX - d.x;
  const target = Math.abs(dx) > slideWidth() * 0.15 ? start + (dx < 0 ? 1 : -1) : start;
  track.scrollTo({ left: target * slideWidth(), behavior: 'smooth' });
}
track.addEventListener('pointerup', endMouseDrag);
track.addEventListener('pointercancel', endMouseDrag);
track.addEventListener('dragstart', event => event.preventDefault());

// Decode every photo up front so the first swipe never waits on image decoding.
allImages.forEach(img => img.decode?.().catch(() => {}));

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
  skuTimer = setTimeout(() => { skuCopy.classList.remove('is-copied'); skuStatus.textContent = ''; }, 1800); // confirmation hold
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
document.querySelectorAll('.delivery-manager').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  showToast(event.currentTarget.textContent);
})); // open delivery block + the «Доставка — аккордеон» experiment
// Category → catalogue (not part of this prototype yet): stay on the card and say where it leads.
document.querySelector('.product-category').addEventListener('click', event => {
  event.preventDefault();
  showToast('Каталог: Сумка с ручками');
});
document.querySelectorAll('.city-link').forEach(link => link.addEventListener('click', () => showToast('Доступна доставка по Москве')));
document.querySelector('.delivery-options .text-link').addEventListener('click', () => {
  document.querySelector('.details-section .accordion summary').scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('Примерка в бутике и самовывоз');
});
document.querySelectorAll('.capacity-item__image img').forEach(img => img.addEventListener('error', () => { img.hidden = true; }));
// Wishlist heart (2026-11-10 refinement): both approved icons stay stacked in the button's icon slot and cross-fade on
// the compositor (opacity + transform, styles.css → .fav-heart), instead of swapping the DOM node. The filled heart's
// optical bounds are 16 grid units vs 17 for the outline (incl. its line), so it is drawn at 17/16 to keep the same
// size in both states.
document.querySelectorAll('.bottom-bar__favorite').forEach(button => {
  const slot = button.querySelector('.ds-button__icon');
  if (!slot) return;
  const outline = createIcon('heart'); outline.classList.add('fav-heart', 'fav-heart--outline');
  const filled = createIcon('heart-filled'); filled.classList.add('fav-heart', 'fav-heart--filled');
  slot.replaceChildren(outline, filled);
  slot.classList.add('fav-hearts');
});
document.querySelectorAll('.favorite-button, .bottom-bar__favorite').forEach(button => button.addEventListener('click', () => {
  const saved = button.classList.toggle('is-saved');
  if (!button.querySelector('.fav-hearts')) button.querySelector('.ds-button__icon')?.replaceChildren(createIcon(saved ? 'heart-filled' : 'heart'));
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
