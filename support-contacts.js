// Contact methods in the «Связаться с нами» popup (order and titles from the design brief 2026-11-09). Cards carry the
// title only; the shared schedule («Ежедневно с 11:00 до 22:00», all channels) sits once under the popup heading.
// href = the real destination. None is configured yet (no verified support contacts in the projects, checked
// 2026-11-09; user: leave as is for now), so every href is null: the card stays visible, but tapping it only says the
// contact is not connected — no invented numbers or usernames. To connect one, set its href, e.g.:
//   max: 'https://max.ru/<id>', telegram: 'https://t.me/<username>', whatsapp: 'https://wa.me/<digits>', phone: 'tel:+7…'
export const SUPPORT_CONTACTS = [
  { id: 'max', label: 'Max', icon: './assets/contact-max.svg', href: null },
  { id: 'telegram', label: 'Telegram', icon: './assets/contact-telegram.svg', href: null },
  { id: 'whatsapp', label: 'WhatsApp', icon: './assets/contact-whatsapp.svg', href: null },
  { id: 'phone', label: 'Позвонить нам', icon: './assets/contact-phone.svg', href: null },
];
