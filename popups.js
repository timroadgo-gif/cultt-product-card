// One Popup System host for the product page (IOS:UI Agent/playground host via ./popup → playground/js): one popup at a
// time, its own fixed layer above the page, the product screen inert while open, page scroll locked.
import { createHost } from './popup/popup-host.js?v=391548a1eada';
import { node } from './popup/ui/sheet.js?v=391548a1eada';

export function createPagePopups(screen) {
  const layer = node('div', 'popup-layer support-popup-layer');
  document.body.append(layer);
  const host = createHost({ layer, background: [screen] });
  const root = document.documentElement;
  // Every popup variant opened through here gets the scroll lock (its own onOpen/onClose still run).
  return {
    open(variant, trigger) {
      host.open({
        ...variant,
        onOpen: (ctx) => { root.classList.add('is-popup-open'); variant.onOpen?.(ctx); },
        onClose: () => { root.classList.remove('is-popup-open'); variant.onClose?.(); },
      }, trigger);
    },
    close: () => host.close(),
  };
}
