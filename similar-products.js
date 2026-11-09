// Similar products strip (scenario «Карточка товара — похожие товары»): one horizontal row of compact grey cards —
// 3:4 photo on the left, brand + model and price beside it — directly under the gallery (user's reference). Rendered from data
// (similar-products.data.js); shown only when the scenario lists the 'similar' section (html[data-sections], styles.css).
// Items have no destination yet, so they are not links (no fake navigation).
import { SIMILAR_PRODUCTS } from './similar-products.data.js?v=0c0a4ea2f08a';

const formatPrice = value => `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`;

export function renderSimilarProducts(list, products = SIMILAR_PRODUCTS) {
  // Keyboard: the row is focusable only when it overflows, so arrow keys can scroll it (no tab stop otherwise).
  new ResizeObserver(() => {
    if (list.scrollWidth > list.clientWidth + 1) list.tabIndex = 0; else list.removeAttribute('tabindex');
  }).observe(list);
  list.replaceChildren(...products.map(product => {
    const item = document.createElement('li');
    item.className = 'similar__item';
    item.dataset.id = product.id;
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
  }));
}
