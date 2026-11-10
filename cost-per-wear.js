// Cost per wear (scenario «Связаться с поддержкой», html[data-sections~="cost-per-wear"]): a tappable row under Yandex
// Split — wallet icon + amount (green) + «за 1 выход» — and a calculator popup on the canonical Popup System. The popup
// holds a form control (UI Kit Field), so the host always presents it as the full-width bottom sheet.
// amount = product price (read from the page's price, .price-value) / number of wears, rounded to whole roubles.
// The number of wears lives in this module: kept while the page is open, reset on reload, never shared with other products.
import { createField, setFieldError } from './design-system/components/field/field.js?v=ec6bb1c5b912';
import { sheet, head, body, node } from './popup/ui/sheet.js?v=ec6bb1c5b912';

const DEFAULT_WEARS = 100;
const MAX_DIGITS = 5; // up to 99 999 wears
const HEADING = 'Что такое цена за выход';
const TEXT = 'Чем чаще вы носите вещь, тем меньше её стоимость за один выход. Рассчитайте цену за выход для этого товара.';
const ERROR = 'Введите целое число больше нуля';

const formatRub = (value) => `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`;
const wearsWord = (n) => { const a = n % 100, b = n % 10; return a > 10 && a < 20 ? 'выходов' : b === 1 ? 'выход' : b > 1 && b < 5 ? 'выхода' : 'выходов'; };

export function initCostPerWear({ popups }) {
  const priceEl = document.querySelector('.price-value');
  const row = document.querySelector('.cpw-row');
  if (!priceEl || !row) return;
  const price = Number(priceEl.textContent.replace(/\D/g, '')); // 252 000 ₽ → 252000
  const amountEl = row.querySelector('.cpw-row__amount');
  let wears = DEFAULT_WEARS;

  const perWear = (n) => Math.round(price / n);
  function renderRow() {
    amountEl.textContent = formatRub(perWear(wears));
    row.setAttribute('aria-label', `Цена за выход: ${formatRub(perWear(wears))}, расчёт на ${wears} ${wearsWord(wears)}. Открыть калькулятор`);
  }
  renderRow();

  function content() {
    const field = createField({ label: 'Количество выходов', value: String(wears) });
    const input = field.querySelector('input');
    Object.assign(input, { inputMode: 'numeric', autocomplete: 'off', maxLength: MAX_DIGITS, enterKeyHint: 'done' });
    input.setAttribute('pattern', '[0-9]*');
    const result = node('p', 'cpw-result ds-text-heading-s', ['1 выход = ', node('span', 'cpw-result__amount', [formatRub(perWear(wears))])]);
    result.setAttribute('aria-live', 'polite');
    const resultAmount = result.querySelector('.cpw-result__amount');

    input.addEventListener('input', () => {
      const digits = input.value.replace(/\D/g, '').slice(0, MAX_DIGITS); // digits only: no minus, comma, dot or letters
      if (digits !== input.value) input.value = digits;
      const n = Number(digits);
      if (!digits || n < 1) { // empty or zero: no misleading result, UI Kit field error state
        setFieldError(field, ERROR);
        resultAmount.textContent = '—';
        return;
      }
      setFieldError(field, null);
      wears = n;
      resultAmount.textContent = formatRub(perWear(n));
      renderRow(); // the page row follows the calculator
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });

    return sheet(head({ heading: HEADING, text: TEXT }), body([node('div', 'cpw-field', [field])]), result);
  }

  const popup = {
    id: 'cost-per-wear',
    kind: 'sheet',
    category: 'simple', // one simple field (Popup System rule); the field makes the host present a full sheet
    // Visible close control like the contact popup (user brief), no drag indicator; no discard guard: the number is
    // applied live to the page, there is nothing to lose.
    dismiss: { closeButton: true, indicator: false, guard: false },
    title: HEADING,
    render: content,
  };
  row.addEventListener('click', () => popups.open(popup, row));
}
