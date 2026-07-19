// Отправка заявки в Telegram через Bot API (только backend).
// Токен/chat_id — из окружения, в лог не попадают. Таймаут — общий fetchWithTimeout.
import { config } from '../config/env.js';
import { fetchWithTimeout } from '../lib/http.js';

// Экспортируется для переиспользования в pipedrive-service (логику Telegram не меняем).
export const FORM_LABELS = {
  price: 'Отримати актуальну вартість',
  remont: 'Розрахунок ремонту',
  instal: 'Розстрочка від забудовника',
  callback: 'Замовити дзвінок',
  house: 'Заявка з картки будинку',
  presentation: 'Запис на презентацію',
  unknown: 'Заявка з сайту',
};

// Возвращает { ok:true } только при реально успешном ответе Telegram.
// При любой проблеме — { ok:false, error } с техническим кодом (без ПДн).
export async function sendToTelegram(data) {
  const { botToken, chatId, apiBase } = config.telegram;
  if (!botToken || !chatId) return { ok: false, error: 'not_configured' };

  const url = `${apiBase}/bot${botToken}/sendMessage`;
  try {
    const res = await fetchWithTimeout(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: buildMessage(data), disable_web_page_preview: true }),
      },
      config.externalTimeoutMs,
    );
    if (!res.ok) return { ok: false, error: 'telegram_http_' + res.status };
    const json = await res.json().catch(() => null);
    if (!json || json.ok !== true) return { ok: false, error: 'telegram_api_error' };
    return { ok: true };
  } catch (err) {
    // AbortError = таймаут; иначе — сетевая ошибка.
    return { ok: false, error: err && err.name === 'AbortError' ? 'telegram_timeout' : 'telegram_network' };
  }
}

// Формирует текст сообщения. Строки для отсутствующих полей не добавляются;
// для отсутствующих UTM выводится «не вказано».
export function buildMessage(data) {
  const f = data.fields || {};
  const u = data.utm || {};
  const lines = ['🔔 Нова заявка з лендінгу таунхауси', ''];

  lines.push(`Форма: ${FORM_LABELS[data.formType] || data.formType}`);
  if (f.name) lines.push(`Ім’я: ${f.name}`);
  lines.push(`Телефон: ${data.phone}`);
  if (f.email) lines.push(`Email: ${f.email}`);

  const known = new Set(['name', 'email', 'comment']);
  const extra = Object.entries(f).filter(([k]) => !known.has(k));
  if (f.comment || extra.length) {
    lines.push('', 'Додаткові дані:');
    if (f.comment) lines.push(f.comment);
    for (const [k, v] of extra) lines.push(`${k}: ${v}`);
  }

  lines.push(
    '',
    '📊 UTM-мітки:',
    `Source: ${u.utm_source || 'не вказано'}`,
    `Medium: ${u.utm_medium || 'не вказано'}`,
    `Campaign: ${u.utm_campaign || 'не вказано'}`,
    `Content: ${u.utm_content || 'не вказано'}`,
    `Term: ${u.utm_term || 'не вказано'}`,
  );

  return lines.join('\n');
}
