// Одна общая маска '+38 (0XX) XXX-XX-XX' и UI-валидация для ВСЕХ телефонных полей.
// Без сторонних библиотек масок. Правила проверки берутся из shared/phone.js.
import { isValidUaMobile, PHONE_ERROR_TEXT } from '../shared/phone.js';

const FIXED = '+38 (0'; // визуально фиксированный префикс; редактируется только абонентская часть
const errEls = new Map();
const touched = new Set();

export function initPhoneInputs() {
  document.querySelectorAll('input[type="tel"]').forEach((el) => {
    if (errEls.has(el)) return; // идемпотентно — слушатели навешиваются один раз

    const err = document.createElement('div');
    err.className = 'phone-error';
    err.textContent = PHONE_ERROR_TEXT;
    err.style.display = 'none';
    const anchor = el.closest('.lfields') || el.closest('.mform-row') || el;
    anchor.insertAdjacentElement('afterend', err);
    errEls.set(el, err);

    el.addEventListener('input', () => {
      reformat(el);
      // Ошибку не показываем при вводе; но если поле уже «тронуто» и стало
      // валидным — сразу убираем (требование: убирать после исправления).
      if (touched.has(el) && isValidUaMobile(el.value)) toggleError(el, false);
    });
    // Проверка после blur (первое взаимодействие = ошибка может появиться).
    el.addEventListener('blur', () => { touched.add(el); toggleError(el, !isValidUaMobile(el.value)); });
  });
}

// Проверка при отправке. Показывает/снимает ошибку, возвращает валидность.
export function validatePhone(el) {
  touched.add(el);
  const ok = isValidUaMobile(el.value);
  toggleError(el, !ok);
  return ok;
}

function toggleError(el, show) {
  const err = errEls.get(el);
  if (err) err.style.display = show ? '' : 'none';
}

// ── Маска ────────────────────────────────────────────────────────────────
// Абонентская часть — 9 цифр без ведущего 0 (коды операторов не начинаются с 0),
// поэтому ведущие нули/код страны из ввода можно безопасно срезать.
function extractSub(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('380')) d = d.slice(3);
  else if (d.startsWith('38')) d = d.slice(2);
  d = d.replace(/^0+/, '');
  return d.slice(0, 9);
}

function format(sub) {
  if (!sub) return '';
  let s = FIXED + sub.slice(0, 2);
  if (sub.length >= 2) s += ')';
  if (sub.length > 2) s += ' ' + sub.slice(2, 5);
  if (sub.length > 5) s += '-' + sub.slice(5, 7);
  if (sub.length > 7) s += '-' + sub.slice(7, 9);
  return s;
}

// Позиция каретки после n абонентских цифр в отформатированной строке.
function caretForSub(formatted, n) {
  if (n <= 0) return Math.min(FIXED.length, formatted.length);
  for (let i = FIXED.length; i <= formatted.length; i++) {
    if (formatted.slice(FIXED.length, i).replace(/\D/g, '').length >= n) return i;
  }
  return formatted.length;
}

function reformat(el) {
  const val = el.value;
  const selStart = el.selectionStart == null ? val.length : el.selectionStart;
  // Сколько абонентских цифр стоит ДО каретки — считаем той же нормализацией,
  // поэтому позиция сохраняется при вводе, вставке, Backspace и Delete.
  const subBefore = extractSub(val.slice(0, selStart)).length;
  const sub = extractSub(val);
  const formatted = format(sub);
  if (formatted !== val) el.value = formatted;
  const pos = caretForSub(formatted, Math.min(subBefore, sub.length));
  try { el.setSelectionRange(pos, pos); } catch { /* некоторые типы input не поддерживают */ }
}
