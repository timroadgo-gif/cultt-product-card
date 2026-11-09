// Contact methods in the «Связаться с нами» popup (order, titles and descriptions from the design brief 2026-11-09).
// href = the real destination. None is configured yet (no verified support contacts in the projects, checked
// 2026-11-09; user: leave as is for now), so every href is null: the card stays visible, but tapping it only says the
// contact is not connected — no invented numbers or usernames. To connect one, set its href, e.g.:
//   max: 'https://max.ru/<id>', telegram: 'https://t.me/<username>', whatsapp: 'https://wa.me/<digits>', phone: 'tel:+7…'
// The phone hours are illustrative prototype content, not verified business hours.
export const SUPPORT_CONTACTS = [
  { id: 'max', label: 'Max', description: 'Напишите нам — менеджер ответит на ваши вопросы', icon: './assets/contact-max.svg', href: null },
  { id: 'telegram', label: 'Написать в Telegram', description: 'Поможем с выбором, оплатой и доставкой', icon: './assets/contact-telegram.svg', href: null },
  { id: 'whatsapp', label: 'Написать в WhatsApp', description: 'Наш менеджер ответит вам в ближайшее время', icon: './assets/contact-whatsapp.svg', href: null },
  { id: 'phone', label: 'Позвонить нам', description: 'Пн–Сб: 10:00–21:00', icon: './assets/contact-phone.svg', href: null },
];
