// Строгая серверная валидация заявки. Телефон проверяется ТЕМ ЖЕ shared-модулем,
// что и на фронтенде. Пропускаем все реально присутствующие поля формы (без
// придумывания новых), санитайзим строки и ограничиваем длину.
import { isValidUaMobile, normalizePhone, PHONE_ERROR_TEXT } from '../../src/shared/phone.js';

const FORM_TYPES = ['price', 'remont', 'instal', 'callback', 'house', 'presentation', 'unknown'];
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

const clean = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function validateLead(body) {
  const b = body && typeof body === 'object' ? body : {};
  const rawFields = b.fields && typeof b.fields === 'object' ? b.fields : {};

  const phoneRaw = typeof rawFields.phone === 'string' ? rawFields.phone : '';
  if (!isValidUaMobile(phoneRaw)) {
    return { valid: false, errors: { phone: PHONE_ERROR_TEXT }, data: null };
  }

  // Все прочие поля формы — как есть (только строки, с лимитом длины).
  const fields = {};
  for (const [k, v] of Object.entries(rawFields)) {
    if (k === 'phone') continue;
    const val = clean(v);
    if (val) fields[String(k).slice(0, 50)] = val;
  }

  // UTM — только строки из белого списка ключей, с лимитом длины.
  const utm = {};
  for (const key of UTM_KEYS) {
    const v = b.utm && typeof b.utm[key] === 'string' ? b.utm[key].trim().slice(0, 200) : '';
    if (v) utm[key] = v;
  }

  return {
    valid: true,
    errors: {},
    data: {
      formType: FORM_TYPES.includes(b.formType) ? b.formType : 'unknown',
      page: clean(b.page, 200),
      phone: normalizePhone(phoneRaw),
      fields,
      utm,
    },
  };
}

export { PHONE_ERROR_TEXT };
