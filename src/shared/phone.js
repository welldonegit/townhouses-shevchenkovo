// Единый источник правды для телефонов (импортируется и фронтендом, и бэкендом).
// Список кодов НЕ дублируется больше нигде.

export const UKRAINIAN_MOBILE_PREFIXES = [
  '020',
  '050',
  '063',
  '066',
  '067',
  '068',
  '073',
  '075',
  '077',
  '089',
  '091',
  '092',
  '093',
  '094',
  '095',
  '096',
  '097',
  '098',
  '099',
];

export const PHONE_ERROR_TEXT = 'Вкажіть коректний номер українського мобільного оператора';

// Приводит любой допустимый ввод к каноническому виду '+380XXXXXXXXX' (12 цифр)
// или возвращает null, если из ввода нельзя собрать номер нужной длины.
// Принимает: '0501234567', '380501234567', '+380501234567', '501234567'.
export function normalizePhone(input) {
  const digits = String(input == null ? '' : input).replace(/\D/g, '');
  let sub; // 9-значная абонентская часть (без ведущего 0)
  if (digits.length === 12 && digits.startsWith('380')) sub = digits.slice(3);
  else if (digits.length === 11 && digits.startsWith('38')) sub = digits.slice(2);
  else if (digits.length === 10 && digits.startsWith('0')) sub = digits.slice(1);
  else if (digits.length === 9) sub = digits;
  else return null;
  if (sub.length !== 9) return null;
  return '+380' + sub;
}

// Код номера (напр. '077') из нормализованного '+380XXXXXXXXX'.
// Код = первые 3 цифры национального номера после '+38', т.е. с ведущим 0.
// Оператора по коду НЕ определяем — код нужен только для проверки диапазона.
export function phoneCode(normalized) {
  if (!normalized || !/^\+380\d{9}$/.test(normalized)) return null;
  return '0' + normalized.slice(4, 6);
}

// Номер валиден, только если после нормализации: ровно 12 цифр, начинается с
// '+380' и код входит в разрешённый список.
export function isValidUaMobile(input) {
  const normalized = normalizePhone(input);
  if (!normalized) return false;
  const code = phoneCode(normalized);
  return code != null && UKRAINIAN_MOBILE_PREFIXES.includes(code);
}
