// Contact methods in the «Связаться с поддержкой» popup (order and labels from the design).
// href = the real destination. None is configured yet (no verified support contacts in the projects, checked
// 2026-11-09), so every href is null: the row stays visible, but tapping it only says the contact is not connected —
// no invented numbers or usernames. To connect one, set its href, e.g.:
//   max: 'https://max.ru/<id>', telegram: 'https://t.me/<username>', whatsapp: 'https://wa.me/<digits>', phone: 'tel:+7…'
export const SUPPORT_CONTACTS = [
  { id: 'max', label: 'Max', icon: './assets/contact-max.svg', href: null },
  { id: 'telegram', label: 'Написать в Telegram', icon: './assets/contact-telegram.svg', href: null },
  { id: 'whatsapp', label: 'Написать в WhatsApp', icon: './assets/contact-whatsapp.svg', href: null },
  { id: 'phone', label: 'Позвонить нам', icon: './assets/contact-phone.svg', href: null },
];
