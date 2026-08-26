// Третий независимый канал доставки заявки — Google Apps Script Web App.
// Без googleapis и Service Account: обычный POST JSON на URL вида .../exec,
// авторизация — общий секрет в теле запроса.
//
// ВАЖНО: используется fetchWithTimeout (нативные http/https), а НЕ глобальный
// fetch. На хостинге undici поднимает WASM-парсер llhttp и падает по памяти,
// роняя процесс (наружу — 502). Подробности в server/lib/http.js.
//
// В лог не попадают ни секрет, ни данные клиента — только коды состояния.
import { config } from '../config/env.js';
import { fetchWithTimeout } from '../lib/http.js';
import { formLabel, fieldLabel } from './telegram-service.js';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

// Успех только если: запрос завершился, тело разобралось как JSON и в нём ok:true.
// HTTP 200 с { ok:false } — это ошибка.
export async function sendToGoogleSheets(data) {
  const { url, secret, timeoutMs } = config.googleSheets;
  if (!url || !secret) return { ok: false, reason: 'not_configured' };

  let res;
  try {
    res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(data, secret)),
      },
      timeoutMs,
    );
  } catch (err) {
    const code = err && err.name === 'AbortError' ? 'timeout' : 'network';
    console.warn('[sheets]', { error: code });
    return { ok: false, reason: 'sheets_' + code };
  }

  if (!res.ok) {
    console.warn('[sheets]', { status: res.status, error: 'http' });
    return { ok: false, reason: 'sheets_http_' + res.status };
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!json) {
    console.warn('[sheets]', { status: res.status, error: 'bad_json' });
    return { ok: false, reason: 'sheets_bad_json' };
  }
  if (json.ok !== true) {
    console.warn('[sheets]', { status: res.status, error: 'rejected' });
    return { ok: false, reason: 'sheets_rejected' };
  }
  return { ok: true };
}

// Дополнительные поля формы (напр. «Цікавить» из формы підбору) в таблице
// отдельных колонок не имеют, поэтому дописываются в колонку comment —
// иначе ответ клиента терялся бы.
const EXTRA_SKIP = new Set(['name', 'email', 'comment', 'house']);
function buildComment(f) {
  const extra = Object.entries(f)
    .filter(([k, v]) => !EXTRA_SKIP.has(k) && v)
    .map(([k, v]) => `${fieldLabel(k)}: ${v}`);
  return [f.comment || '', ...extra].filter(Boolean).join(' · ');
}

// Только поля уже провалидированного payload — ничего не выдумываем.
// Порядок ключей совпадает с порядком колонок в таблице.
// Про дом: он не теряется без additional — formLabel дописывает его к названию
// формы («Заявка з картки будинку ТАУНХАУС 57,60м²»).
export function buildPayload(data, secret) {
  const f = data.fields || {};
  const u = data.utm || {};

  const utm = {};
  for (const key of UTM_KEYS) utm[key] = u[key] || '';

  return {
    secret,
    createdAt: new Date().toISOString(),
    formName: formLabel(data), // та же подпись, что в Telegram и Pipedrive
    name: f.name || '',
    phone: data.phone,
    email: f.email || '',
    comment: buildComment(f),
    pageUrl: data.page || '',
    utm,
  };
}
