// UI Kit (../IOS:UI Agent/design-system via the design-system link): icons from the approved registry, glass controls
// through GlassIconButton (live Liquid Glass engine), actions through Button. No local icon or glass implementations.
import { createIcon } from './design-system/icons/icon.js?v=d8afa49f9ef0';
import { createIconButton } from './design-system/components/icon-button/icon-button.js?v=d8afa49f9ef0';
import { createButton } from './design-system/components/button/button.js?v=d8afa49f9ef0';

// Static icon slots: <span data-icon="name"> gets the registry icon; size comes from the slot's CSS (--icon-px).
document.querySelectorAll('[data-icon]').forEach(slot => {
  const size = parseFloat(getComputedStyle(slot).getPropertyValue('--icon-px')) || 24;
  slot.append(createIcon(slot.dataset.icon, { size }));
});

// Navigation over the photo: GlassIconButton 44 (functional layer over content).
document.querySelector('[data-slot="nav-leading"]').append(createIconButton({ icon: 'arrow-left', ariaLabel: 'Назад' }));
document.querySelector('[data-slot="nav-trailing"]').append(
  createIconButton({ icon: 'share', ariaLabel: 'Поделиться' }),
  createIconButton({ icon: 'shopping-bag', ariaLabel: 'Корзина' }),
);

// Bottom actions: Button primary / large / fill + Button secondary / icon-only (favourite).
const bottomBar = document.querySelector('.bottom-bar');
const bottomAdd = createButton({ label: 'В корзину', variant: 'primary', width: 'fill' });
bottomAdd.classList.add('bottom-bar__add');
const favorite = createButton({ variant: 'secondary', iconPosition: 'only', icon: 'heart', ariaLabel: 'Добавить в избранное' });
favorite.classList.add('bottom-bar__favorite');
favorite.setAttribute('aria-pressed', 'false');
bottomBar.append(bottomAdd, favorite);
const setBottomLabel = text => { bottomAdd.querySelector('.ds-button__label').textContent = text; };

const track = document.querySelector('#galleryTrack');
const rail = track.querySelector('.gallery__rail');
const dots = [...document.querySelectorAll('#galleryProgress span')];
const toast = document.querySelector('#toast');
let toastTimer;
let galleryIndex = 0;
let touchStart = null;
let mouseStartX = null;
let lastWheelSlide = 0;
const topbar = document.querySelector('.gallery__topbar');
const gallery = document.querySelector('.gallery');
const availabilityStates = ['available', 'sold_with_price', 'sold_price_hidden'];
let availabilityIndex = 0;
const priceTrigger = document.querySelector('.price-state-trigger');
const priceValue = priceTrigger.querySelector('.price-value');
const soldStatus = priceTrigger.querySelector('.sold-status');
const soldCaption = document.querySelector('.sold-caption');
const findSimilar = document.querySelector('.find-similar');
const splitRow = document.querySelector('.split-row');
const deliveryCard = document.querySelector('.delivery-card');

function renderAvailability() {
  const state = availabilityStates[availabilityIndex];
  const available = state === 'available';
  document.body.dataset.availability = state;
  priceValue.hidden = state === 'sold_price_hidden';
  soldStatus.hidden = state !== 'sold_price_hidden';
  soldCaption.hidden = state !== 'sold_with_price';
  findSimilar.hidden = state !== 'sold_price_hidden';
  splitRow.hidden = !available;
  deliveryCard.hidden = !available;
  setBottomLabel(available ? 'В корзину' : 'Найти похожий');
  const label = available ? 'в наличии' : state === 'sold_with_price' ? 'продано, цена показана' : 'продано, цена скрыта';
  priceTrigger.setAttribute('aria-label', `Статус: ${label}. Показать следующий статус товара`);
}

priceTrigger.addEventListener('click', () => {
  availabilityIndex = (availabilityIndex + 1) % availabilityStates.length;
  renderAvailability();
});
findSimilar.addEventListener('click', () => showToast('Поиск похожих товаров'));
renderAvailability();

function updateTopbar() {
  const solid = gallery.getBoundingClientRect().bottom <= topbar.offsetHeight;
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

function showGallerySlide(index) {
  galleryIndex = Math.max(0, Math.min(index, dots.length - 1));
  rail.style.transform = `translate3d(-${galleryIndex * 100}%, 0, 0)`;
  dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === galleryIndex));
  document.querySelector('#galleryProgress').setAttribute('aria-label', `Фото ${galleryIndex + 1} из ${dots.length}`);
}

track.addEventListener('touchstart', event => {
  const touch = event.touches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

track.addEventListener('touchend', event => {
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2) {
    showGallerySlide(galleryIndex + (dx < 0 ? 1 : -1));
  }
  touchStart = null;
}, { passive: true });

track.addEventListener('mousedown', event => {
  if (event.button === 0) mouseStartX = event.clientX;
});
track.addEventListener('mouseup', event => {
  if (mouseStartX === null) return;
  const dx = event.clientX - mouseStartX;
  if (Math.abs(dx) > 35) showGallerySlide(galleryIndex + (dx < 0 ? 1 : -1));
  mouseStartX = null;
});
track.addEventListener('mouseleave', () => { mouseStartX = null; });

track.addEventListener('wheel', event => {
  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
  event.preventDefault();
  if (Date.now() - lastWheelSlide < 300 || Math.abs(event.deltaX) < 15) return;
  showGallerySlide(galleryIndex + (event.deltaX > 0 ? 1 : -1));
  lastWheelSlide = Date.now();
}, { passive: false });

document.querySelector('.gallery__progress').addEventListener('click', event => {
  const dot = event.target.closest('span');
  if (!dot) return;
  showGallerySlide(dots.indexOf(dot));
});

document.querySelector('.copy-button').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('P31838651');
    showToast('Артикул скопирован');
  } catch {
    showToast('Артикул: P31838651');
  }
});

document.querySelector('.gallery__topbar button[aria-label="Назад"]').addEventListener('click', () => {
  if (history.length > 1) history.back();
  else showToast('Карточка товара');
});

document.querySelector('.gallery__topbar button[aria-label="Поделиться"]').addEventListener('click', async () => {
  const shareData = { title: 'Louis Vuitton Noe — THE CULTT', url: location.href };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch { /* user dismissed the share sheet */ }
  } else if (navigator.clipboard) {
    try { await navigator.clipboard.writeText(location.href); showToast('Ссылка скопирована'); }
    catch { showToast('Louis Vuitton Noe'); }
  } else showToast('Louis Vuitton Noe');
});

document.querySelector('.gallery__topbar button[aria-label="Корзина"]').addEventListener('click', () => showToast(availabilityIndex === 0 ? 'Товар добавлен в корзину' : 'Корзина'));
bottomAdd.addEventListener('click', () => showToast(availabilityIndex === 0 ? 'Товар добавлен в корзину' : 'Поиск похожих товаров'));
document.querySelectorAll('.info-button').forEach(button => button.addEventListener('click', () => {
  showToast(button.getAttribute('aria-label'));
}));
document.querySelector('.delivery-manager').addEventListener('click', event => {
  event.preventDefault();
  showToast(event.currentTarget.textContent);
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

// Accordions: a measured reveal that resumes from its current height on rapid taps.
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.accordion').forEach(details => {
  const summary = details.querySelector('summary');
  const body = details.querySelector('.accordion__body');
  let animation = null;
  details.classList.toggle('is-expanded', details.open);
  details.classList.add('is-managed');
  details.addEventListener('toggle', () => {
    if (!animation) details.classList.toggle('is-expanded', details.open);
  });
  summary.addEventListener('click', event => {
    event.preventDefault();
    const expand = !details.classList.contains('is-expanded');
    details.classList.toggle('is-expanded', expand);
    const from = details.open ? body.getBoundingClientRect().height : 0;
    if (animation) animation.cancel();
    animation = null;
    if (reduceMotion.matches) { body.style.overflow = ''; details.open = expand; return; }
    details.open = true;
    const to = expand ? body.scrollHeight : 0;
    body.style.overflow = 'hidden';
    const current = body.animate({ height: [`${from}px`, `${to}px`] }, { duration: expand ? 300 : 240, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
    animation = current;
    current.onfinish = () => {
      if (!expand) details.open = false; // close before releasing the held 0px height, so nothing flashes
      body.style.overflow = '';
      current.cancel();
      animation = null;
    };
  });
});
