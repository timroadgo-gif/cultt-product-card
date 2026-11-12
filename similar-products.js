// Similar products strip (scenario «Карточка товара — похожие товары»): one horizontal row of compact grey cards —
// 3:4 photo on the left, brand + model and price beside it — directly under the gallery (user's reference). Rendered from data
// (similar-products.data.js); shown only when the scenario lists the 'similar' section (html[data-sections], styles.css).
// Items have no destination yet, so they are not links (no fake navigation).
import { SIMILAR_CAROUSEL } from './similar-products.data.js?v=f0e9f32aa745';
import { createIcon } from './design-system/icons/icon.js?v=f0e9f32aa745';

const formatPrice = value => `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`;

export function renderSimilarProducts(list, products = SIMILAR_CAROUSEL) {
  // Keyboard: the row is focusable only when it overflows, so arrow keys can scroll it (no tab stop otherwise).
  new ResizeObserver(() => {
    if (list.scrollWidth > list.clientWidth + 1) list.tabIndex = 0; else list.removeAttribute('tabindex');
  }).observe(list);
  const items = products.map((product, index) => {
    const item = document.createElement('li');
    item.className = 'similar__item';
    item.dataset.id = product.id;
    item.dataset.position = String(index + 1);
    const media = document.createElement('span');
    media.className = 'similar__media';
    const img = new Image(252, 336);
    img.src = product.image;
    img.alt = product.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.append(img);
    const text = document.createElement('span');
    text.className = 'similar__text';
    const name = document.createElement('span');
    name.className = 'similar__name';
    name.textContent = `${product.brand} ${product.model}`;
    const price = document.createElement('span');
    price.className = 'similar__price';
    price.textContent = formatPrice(product.price);
    text.append(name, price);
    item.append(media, text);
    return item;
  });
  list.replaceChildren(...items, createViewAllItem());
}

// Last tile of the row: «Посмотреть все» on the same quiet card surface and height as the products, text + small arrow.
// No catalogue destination exists in the prototype, so the button deliberately does nothing (no invented URL, page or sheet).
function createViewAllItem() {
  const item = document.createElement('li');
  item.className = 'similar__item similar__item--all';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'similar__all';
  button.setAttribute('aria-label', 'Посмотреть все похожие товары');
  const label = document.createElement('span');
  label.className = 'similar__all-label';
  label.textContent = 'Посмотреть все';
  const icon = createIcon('arrow-right', { presentation: 'compact' });
  icon.classList.add('similar__all-icon');
  icon.setAttribute('aria-hidden', 'true');
  button.append(label, icon);
  item.append(button);
  return item;
}
