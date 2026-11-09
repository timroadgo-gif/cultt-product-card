// Contact support (scenario «Связаться с поддержкой», html[data-sections~="support"]): a floating Liquid Glass button
// (UI Kit GlassIconButton, approved `message` icon) above the bottom purchase bar, and a popup on the canonical Popup
// System (IOS:UI Agent/playground: host = backdrop, motion, focus trap, inert page, swipe, Escape; content blocks
// sheet/head/body). The popup links to the playground's js/ (./popup → playground/js) so it shares this page's UI Kit
// modules (one glass engine).
import { createIconButton } from './design-system/components/icon-button/icon-button.js?v=35372c7d51bc';
import { createIcon } from './design-system/icons/icon.js?v=35372c7d51bc';
import { createHost } from './popup/popup-host.js?v=35372c7d51bc';
import { sheet, head, body, node } from './popup/ui/sheet.js?v=35372c7d51bc';
import { SUPPORT_CONTACTS } from './support-contacts.js?v=35372c7d51bc';

const HEADING = 'Ваш менеджер на связи';
const TEXT = 'Расскажем всё об этом лоте, способах оплаты и доставки — а если нужно, поможем выбрать лот по вашему запросу.';

function contactRow(contact, { close, notify }) {
  const external = contact.href && !contact.href.startsWith('tel:');
  const row = contact.href ? document.createElement('a') : document.createElement('button');
  row.className = 'support-contact ds-corner';
  if (contact.href) {
    row.href = contact.href;
    if (external) { row.target = '_blank'; row.rel = 'noopener'; }
  } else {
    row.type = 'button';
    row.addEventListener('click', () => { close(); notify(`${contact.label}: контакт поддержки ещё не подключён`); });
  }
  const icon = new Image(20, 20);
  icon.src = contact.icon;
  icon.alt = '';
  icon.className = 'support-contact__icon';
  const label = node('span', 'support-contact__label ds-text-body', [contact.label]);
  const chevron = node('span', 'support-contact__chevron', [createIcon('chevron-right', { presentation: 'compact' })]);
  chevron.setAttribute('aria-hidden', 'true');
  row.append(icon, label, chevron);
  return node('li', null, [row]);
}

export function initSupport({ screen, notify }) {
  const layer = node('div', 'popup-layer support-popup-layer');
  document.body.append(layer);
  const host = createHost({ layer, background: [screen] });
  const root = document.documentElement;

  const popup = {
    id: 'contact-support',
    kind: 'sheet',
    category: 'simple', // information + actions, no fields
    // Visible close control (task requirement 2026-11-09): X row instead of the drag indicator; swipe, backdrop and
    // Escape still close it as in every simple popup.
    dismiss: { closeButton: true, indicator: false },
    title: HEADING,
    render: (ctx) => sheet(
      head({ heading: HEADING, text: TEXT }),
      body([node('ul', 'support-contacts', SUPPORT_CONTACTS.map(c => contactRow(c, { close: ctx.close, notify })))]),
    ),
    onOpen: () => root.classList.add('is-popup-open'), // page scroll locked while the popup is open
    onClose: () => root.classList.remove('is-popup-open'),
  };

  const fab = node('div', 'support-fab');
  const button = createIconButton({ icon: 'message', ariaLabel: 'Связаться с поддержкой', onClick: () => host.open(popup, button) });
  fab.append(button);
  screen.append(fab);
}
