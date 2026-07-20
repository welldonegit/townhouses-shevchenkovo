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
import { formLabel } from './telegram-service.js';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

// Успех только если: запрос завершился, тело разобралось как JSON и в нём ok:true.
// HTTP 200 с { ok:false } — это ошибка.
export async function sendToGoogleSheets(data, submissionId) {
  const { url, secret, timeoutMs } = config.googleSheets;
  if (!url || !secret) return { ok: false, reason: 'not_configured' };

  let res;
  try {
    res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(data, submissionId, secret)),
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

// Только поля уже провалидированного payload — ничего не выдумываем.
// additional — всё, что пришло из формы сверх name/email (phone валидация
// выносит отдельно): comment, house и т.п.
export function buildPayload(data, submissionId, secret) {
  const f = data.fields || {};
  const u = data.utm || {};

  const additional = {};
  for (const [k, v] of Object.entries(f)) {
    if (k !== 'name' && k !== 'email') additional[k] = v;
  }

  const utm = {};
  for (const key of UTM_KEYS) utm[key] = u[key] || '';

  return {
    secret,
    createdAt: new Date().toISOString(),
    submissionId,
    formName: formLabel(data), // та же подпись, что в Telegram и Pipedrive
    name: f.name || '',
    phone: data.phone,
    email: f.email || '',
    additional,
    pageUrl: data.page || '',
    utm,
  };
}
