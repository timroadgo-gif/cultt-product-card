// Contact support (scenario «Связаться с поддержкой», html[data-sections~="support"]): a floating Liquid Glass button
// (UI Kit GlassIconButton, approved `message` icon) above the bottom purchase bar, and a popup on the canonical Popup
// System (IOS:UI Agent/playground: host = backdrop, motion, focus trap, inert page, swipe, Escape; content blocks
// sheet/head/body). The popup links to the playground's js/ (./popup → playground/js) so it shares this page's UI Kit
// modules (one glass engine).
import { createIconButton } from './design-system/components/icon-button/icon-button.js?v=d272179ae69d';
import { createIcon } from './design-system/icons/icon.js?v=d272179ae69d';
import { sheet, body, node } from './popup/ui/sheet.js?v=d272179ae69d';
import { SUPPORT_CONTACTS } from './support-contacts.js?v=d272179ae69d';

const HEADING = 'Связаться с нами';
const SCHEDULE = 'Ежедневно с 11:00 до 22:00'; // support hours for every channel (user 2026-11-09)

// Header after the Louis Vuitton «Contact Us» sheet (user reference 2026-11-09): title centred on the sheet, the host's
// glass X in the same row at the top-trailing corner ([data-close-slot]). This departs from the Popup System header
// (X in its own row above a left-aligned heading) at the user's explicit request.
function header() {
  const title = node('h2', 'ps__title ds-text-body support-head__title', [HEADING]); // 14/20 regular: as light as the LV title
  const schedule = node('p', 'support-head__schedule ds-text-caption', [SCHEDULE]);
  const slot = node('div', 'support-head__close');
  slot.dataset.closeSlot = '';
  return node('div', 'support-head', [node('span', 'support-head__spacer'), node('div', 'support-head__text', [title, schedule]), slot]);
}

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
  // Icon = the contact's SVG used as a mask over a token colour (one colour for every mark, whatever the file's own
  // fill), sized per icon for equal optical weight (styles.css → .support-contact__icon--<id>).
  const icon = node('span', `support-contact__icon support-contact__icon--${contact.id}`);
  icon.style.setProperty('--icon', `url("${contact.icon}")`);
  icon.setAttribute('aria-hidden', 'true');
  const text = node('span', 'support-contact__text', [
    node('span', 'support-contact__label ds-text-body', [contact.label]),
  ]);
  const chevron = node('span', 'support-contact__chevron', [createIcon('chevron-right', { presentation: 'compact' })]);
  chevron.setAttribute('aria-hidden', 'true');
  row.append(icon, text, chevron);
  return node('li', null, [row]);
}

export function initSupport({ screen, popups, notify }) {

  const popup = {
    id: 'contact-support',
    kind: 'sheet',
    category: 'simple', // information + actions, no fields
    // Visible close control (task requirement 2026-11-09): X row instead of the drag indicator; swipe, backdrop and
    // Escape still close it as in every simple popup.
    dismiss: { closeButton: true, indicator: false },
    title: HEADING,
    presentation: 'compact', // always the floating island (LV reference); scrolls inside on short screens
    render: (ctx) => {
      const cards = body([node('ul', 'support-contacts', SUPPORT_CONTACTS.map(c => contactRow(c, { close: ctx.close, notify })))]);
      cards.dataset.popupScroll = ''; // split layout: header stays, only the cards scroll when the sheet is short
      const s = sheet(header(), cards);
      s.classList.add('support-sheet');
      return s;
    },
  };

  const fab = node('div', 'support-fab');
  const button = createIconButton({ icon: 'message', ariaLabel: 'Связаться с поддержкой', onClick: () => popups.open(popup, button) });
  fab.append(button);
  screen.append(fab);
}
