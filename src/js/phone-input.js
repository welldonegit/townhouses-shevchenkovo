// Одна общая маска '+38 (0XX) XXX-XX-XX' и UI-валидация для ВСЕХ телефонных полей.
// Без сторонних библиотек масок. Правила проверки берутся из shared/phone.js.
import { isValidUaMobile, PHONE_ERROR_TEXT } from '../shared/phone.js';

const FIXED = '+38 ('; // фиксированный префикс; национальный номер (с ведущим 0) вводит пользователь
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
// Национальный номер: ведущий 0 + до 9 цифр абонента (0XX XXX XX XX).
// Ведущий 0 вводится пользователем («так все вводят»), поэтому сохраняем его.
function extractNational(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('380')) d = d.slice(2);                     // +380XXXXXXXXX → 0XXXXXXXXX
  else if (d.startsWith('38') && d.length >= 11) d = '0' + d.slice(2); // 38 + 9 → 0 + 9
  if (d && d[0] !== '0') d = '0' + d;                          // если ведущий 0 не ввели — добавляем
  return d.slice(0, 10);
}

function format(nat) {
  if (!nat) return '';
  let s = FIXED + nat.slice(0, 3);        // +38 (0XX
  if (nat.length >= 3) s += ')';          // закрываем скобку после кода 0XX
  if (nat.length > 3) s += ' ' + nat.slice(3, 6);
  if (nat.length > 6) s += '-' + nat.slice(6, 8);
  if (nat.length > 8) s += '-' + nat.slice(8, 10);
  return s;
}

// Позиция каретки после n цифр национального номера в отформатированной строке.
function caretForNational(formatted, n) {
  if (n <= 0) return Math.min(FIXED.length, formatted.length);
  for (let i = FIXED.length; i <= formatted.length; i++) {
    if (formatted.slice(FIXED.length, i).replace(/\D/g, '').length >= n) return i;
  }
  return formatted.length;
}

function reformat(el) {
  const val = el.value;
  const selStart = el.selectionStart == null ? val.length : el.selectionStart;
  // Сколько цифр номера стоит ДО каретки — считаем той же нормализацией,
  // поэтому позиция сохраняется при вводе, вставке, Backspace и Delete.
  const before = extractNational(val.slice(0, selStart)).length;
  const nat = extractNational(val);
  const formatted = format(nat);
  if (formatted !== val) el.value = formatted;
  const pos = caretForNational(formatted, Math.min(before, nat.length));
  try { el.setSelectionRange(pos, pos); } catch { /* некоторые типы input не поддерживают */ }
}
