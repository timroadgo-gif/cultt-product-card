// Similar products for the «похожие товары» scenario. Data only — presentation lives in similar-products.js.
// Photos: the user's supplied product photographs (2026-11-06), cut to 3:4 thumbnails framed on the bag
// (bag = 80 % of the frame width, base at 86 % height in every frame; only background removed). Prices are PROTOTYPE values, not real lots.
export const SIMILAR_PRODUCTS = [
  { id: 'loewe-puzzle-green', brand: 'Loewe', model: 'Puzzle', price: 238000, image: './assets/similar-1.webp', alt: 'Loewe Puzzle, зелёная кожа' },
  { id: 'loewe-puzzle-beige', brand: 'Loewe', model: 'Puzzle', price: 214000, image: './assets/similar-2.webp', alt: 'Loewe Puzzle, бежевая кожа' },
  { id: 'loewe-puzzle-tan', brand: 'Loewe', model: 'Puzzle', price: 196000, image: './assets/similar-3.webp', alt: 'Loewe Puzzle, рыжая кожа' },
];

// Carousel sequence for the prototype (user, 2026-11-10): five cards — the three lots, then the first two repeated on purpose
// to give the row enough length — followed by the «Посмотреть всё» tile (similar-products.js). Same data and photos, no new lots.
export const SIMILAR_CAROUSEL = [...SIMILAR_PRODUCTS, ...SIMILAR_PRODUCTS.slice(0, 2)];
