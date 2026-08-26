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
  pick: 'Підбір будинку',
  unknown: 'Заявка з сайту',
};

// Читаемые подписи дополнительных полей формы (всё, что не name/phone/email/
// comment/house). Ключа нет в карте — выводим сам ключ, как и раньше.
export const FIELD_LABELS = {
  interest: 'Цікавить',
};
export const fieldLabel = (key) => FIELD_LABELS[key] || key;

// Подпись формы для уведомлений. Для заявки с карточки дома дополняется
// конкретным домом («Заявка з картки будинку ТАУНХАУС 63,20м²»).
// Используется и Telegram, и Pipedrive — чтобы формулировка была одна.
export function formLabel(data) {
  const base = FORM_LABELS[data.formType] || data.formType;
  const house = data.fields && data.fields.house;
  return house ? `${base} ${house}` : base;
}

// Возвращает { ok:true } только при реально успешном ответе Telegram.
// При любой проблеме — { ok:false, error } с техническим кодом (без ПДн).
export async function sendToTelegram(data) {
  const { botToken, chatId, apiBase } = config.telegram;
  if (!botToken || !chatId) {
    console.warn('[telegram]', { error: 'not_configured' });
    return { ok: false, error: 'not_configured' };
  }

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
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.ok !== true) {
      // description от Telegram (напр. "chat not found", "Unauthorized") — без ПДн клиента.
      console.warn('[telegram]', { status: res.status, description: json && json.description });
      return { ok: false, error: 'telegram_http_' + res.status };
    }
    return { ok: true };
  } catch (err) {
    const code = err && err.name === 'AbortError' ? 'timeout' : 'network';
    console.warn('[telegram]', { error: code });
    return { ok: false, error: 'telegram_' + code };
  }
}

// Формирует текст сообщения. Строки для отсутствующих полей не добавляются;
// для отсутствующих UTM выводится «не вказано».
export function buildMessage(data) {
  const f = data.fields || {};
  const u = data.utm || {};
  const lines = ['🔔 Нова заявка з лендінгу таунхауси', ''];

  lines.push(`Форма: ${formLabel(data)}`);
  if (f.name) lines.push(`Ім’я: ${f.name}`);
  lines.push(`Телефон: ${data.phone}`);
  if (f.email) lines.push(`Email: ${f.email}`);

  // house уже вошёл в строку «Форма», поэтому в «Додаткові дані» не дублируется.
  const known = new Set(['name', 'email', 'comment', 'house']);
  const extra = Object.entries(f).filter(([k]) => !known.has(k));
  if (f.comment || extra.length) {
    lines.push('', 'Додаткові дані:');
    if (f.comment) lines.push(f.comment);
    for (const [k, v] of extra) lines.push(`${fieldLabel(k)}: ${v}`);
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
