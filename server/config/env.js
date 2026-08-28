// Конфигурация из окружения. Секреты — только в .env (локально) или в переменных
// окружения хостинга. В коде значений по умолчанию для секретов нет.
import path from 'path';

// Локально подхватываем .env; на хостинге его может не быть — тогда берём process.env.
try {
  process.loadEnvFile();
} catch {
  /* .env отсутствует — это нормально в проде */
}

const num = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export const config = {
  port: num(process.env.PORT, 3000),
  isProd: process.env.NODE_ENV === 'production',
  // trust proxy включаем только если задан TRUST_PROXY (не «вслепую»).
  // Значение: '' (выкл), 'true'/'false', число хопов или IP/подсеть.
  trustProxy: process.env.TRUST_PROXY || '',

  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '10kb',
  externalTimeoutMs: num(process.env.EXTERNAL_TIMEOUT_MS, 8000),

  rateLimit: {
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
    max: num(process.env.RATE_LIMIT_MAX, 5),
  },

  // Резервное хранилище заявок (содержит ПДн — путь вне git).
  leadsFile: process.env.LEADS_FILE || path.join(process.cwd(), 'data', 'leads.jsonl'),

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
    // База Bot API. По умолчанию — официальный сервер; переопределяется для тестов.
    apiBase: process.env.TELEGRAM_API_BASE || 'https://api.telegram.org',
  },
  // Google Apps Script Web App (третий канал). Без googleapis и Service Account —
  // обычный POST JSON на /exec. Пустые значения = канал выключен.
  googleSheets: {
    url: process.env.GOOGLE_APPS_SCRIPT_URL || '',
    secret: process.env.GOOGLE_APPS_SCRIPT_SECRET || '',
    timeoutMs: num(process.env.GOOGLE_APPS_SCRIPT_TIMEOUT_MS, 10000),
  },
  pipedrive: {
    apiToken: process.env.PIPEDRIVE_API_TOKEN || '',
    companyDomain: process.env.PIPEDRIVE_COMPANY_DOMAIN || '',
    ownerId: process.env.PIPEDRIVE_OWNER_ID || '',
    // Воронка и этап, куда попадает сделка. Пусто = воронка/этап по умолчанию
    // в Pipedrive (сделка всё равно создастся, но не там, где ожидается).
    pipelineId: process.env.PIPEDRIVE_PIPELINE_ID || '',
    stageId: process.env.PIPEDRIVE_STAGE_ID || '',
    labelIds: (process.env.PIPEDRIVE_LABEL_IDS || '').split(',').map((s) => s.trim()).filter(Boolean),
    timeoutMs: num(process.env.PIPEDRIVE_TIMEOUT_MS, 10000),
    // База API. По умолчанию — {companyDomain}.pipedrive.com; переопределяется для тестов.
    apiBase: process.env.PIPEDRIVE_API_BASE
      || (process.env.PIPEDRIVE_COMPANY_DOMAIN ? `https://${process.env.PIPEDRIVE_COMPANY_DOMAIN}.pipedrive.com` : ''),
    // API-ключи (hash) кастомных полей СДЕЛКИ — уходят в custom_fields (API v2).
    // Сами поля создаются в Pipedrive вручную; hash берётся из GET /api/v2/dealFields.
    fieldKeys: {
      utm_source: process.env.PIPEDRIVE_FIELD_UTM_SOURCE || '',
      utm_medium: process.env.PIPEDRIVE_FIELD_UTM_MEDIUM || '',
      utm_campaign: process.env.PIPEDRIVE_FIELD_UTM_CAMPAIGN || '',
      utm_content: process.env.PIPEDRIVE_FIELD_UTM_CONTENT || '',
      utm_term: process.env.PIPEDRIVE_FIELD_UTM_TERM || '',
      ga_client_id: process.env.PIPEDRIVE_FIELD_GOOGLE_CLIENT_ID || '',
    },
  },
};
