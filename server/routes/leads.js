// POST /api/leads — приём заявки: строгая валидация, резервное сохранение,
// независимая доставка в Telegram, Pipedrive и Google Sheets (Promise.allSettled).
// ok:true, если сработал хотя бы один канал; все три провалились → 503.
import express from 'express';
import { randomUUID } from 'crypto';
import { config } from '../config/env.js';
import { validateLead } from '../validation/lead-validation.js';
import { saveLead } from '../services/lead-storage.js';
import { sendToTelegram } from '../services/telegram-service.js';
import { sendToPipedrive } from '../services/pipedrive-service.js';
import { sendToGoogleSheets } from '../services/google-sheets-service.js';

export const leadsRouter = express.Router();

// Простой in-memory rate limit по IP (без внешних зависимостей).
const hits = new Map();
function rateLimit(req, res, next) {
  const { windowMs, max } = config.rateLimit;
  const now = Date.now();
  const ip = req.ip || 'unknown';
  const rec = hits.get(ip);
  if (!rec || now - rec.start > windowMs) {
    hits.set(ip, { start: now, count: 1 });
    return next();
  }
  rec.count += 1;
  if (rec.count > max) return res.status(429).json({ ok: false, error: 'too_many_requests' });
  return next();
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of hits) {
    if (now - rec.start > config.rateLimit.windowMs) hits.delete(ip);
  }
}, config.rateLimit.windowMs).unref();

leadsRouter.post('/', rateLimit, async (req, res, next) => {
  try {
    const { valid, errors, data } = validateLead(req.body);
    if (!valid) {
      return res.status(400).json({ ok: false, error: 'validation_error', fields: errors });
    }

    const submissionId = randomUUID();

    // Резервное сохранение (защитная сетка) — до отправки.
    const storage = await saveLead({ ...data, submissionId, ts: new Date().toISOString() });

    // Каналы независимы: провал одного не влияет на остальные.
    const [tg, pd, gs] = await Promise.allSettled([
      sendToTelegram(data),
      sendToPipedrive(data, submissionId),
      sendToGoogleSheets(data),
    ]);
    const tgVal = tg.status === 'fulfilled' && tg.value ? tg.value : { ok: false, error: 'crashed' };
    const pdVal = pd.status === 'fulfilled' && pd.value ? pd.value : { ok: false, error: 'crashed' };
    const gsVal = gs.status === 'fulfilled' && gs.value ? gs.value : { ok: false, reason: 'crashed' };
    const telegram = tgVal.ok === true;
    const pipedrive = pdVal.ok === true;
    const googleSheets = gsVal.ok === true;

    // Техлог: submissionId/тип/коды каналов, без ПДн.
    console.info('[lead]', {
      submissionId,
      formType: data.formType,
      // Какие UTM реально дошли с фронта (только имена меток, без значений).
      utm: Object.keys(data.utm).join(',') || 'none',
      telegram: telegram ? 'ok' : tgVal.error,
      pipedrive: pipedrive ? 'ok' : pdVal.error,
      googleSheets: googleSheets ? 'ok' : gsVal.reason,
      stored: storage.ok,
    });

    const ok = telegram || pipedrive || googleSheets;
    // channels содержит технический код при провале канала (для диагностики; без ПДн/токенов).
    return res.status(ok ? 201 : 503).json({
      ok,
      channels: {
        telegram: telegram ? true : (tgVal.error || false),
        pipedrive: pipedrive ? true : (pdVal.error || false),
        googleSheets: googleSheets ? true : (gsVal.reason || false),
      },
    });
  } catch (err) {
    return next(err);
  }
});
