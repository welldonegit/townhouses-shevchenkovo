// Express-приложение. В проде (HostPro) отдаёт собранную статику из dist/ и /api.
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js'; // env загружается здесь до использования конфигурации
import { leadsRouter } from './routes/leads.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist'); // абсолютный путь, относительно этого файла

// В production не запускаем сайт «вслепую» без собранного фронтенда.
if (config.isProd && !fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('[fatal] dist/index.html не найден — выполните "npm run build" перед запуском');
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');

// trust proxy — только если задан TRUST_PROXY (важно для rate limit / реального IP за прокси).
if (config.trustProxy) {
  const v = config.trustProxy;
  app.set('trust proxy', v === 'true' ? true : v === 'false' ? false : /^\d+$/.test(v) ? Number(v) : v);
}

// --- security/body middleware ---
app.use(express.json({ limit: config.jsonBodyLimit }));

// --- API ---
app.use('/api/leads', leadsRouter);
app.get('/api/health', (req, res) => res.json({ ok: true }));
// Неизвестный /api/* — контролируемый JSON, а не HTML.
app.use('/api', (req, res) => res.status(404).json({ ok: false, error: 'not_found' }));

// --- раздача собранного фронтенда (/thanks/ = dist/thanks/index.html) ---
app.use(express.static(distDir));

// Канонический URL страницы подяки: старые пути 301-редиректят на /thanks/.
app.get(/^\/thanks$/, (req, res) => res.redirect(301, '/thanks/'));
app.get('/thanks.html', (req, res) => res.redirect(301, '/thanks/'));

// Обычный frontend 404 (без глобального SPA fallback — index.html не отдаём).
app.use((req, res) => res.status(404).send('Not Found'));

// Централизованный обработчик ошибок → всегда контролируемый JSON, без утечки стека.
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ ok: false, error: 'payload_too_large' });
  }
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return res.status(400).json({ ok: false, error: 'invalid_json' });
  }
  console.error('[error]', err && err.message);
  return res.status(500).json({ ok: false, error: 'internal_error' });
});

// PORT из окружения; fallback 3000 — только для локальной разработки. Слушаем 0.0.0.0.
const server = app.listen(config.port, '0.0.0.0', () => console.log(`server listening on :${config.port}`));

// Корректное завершение по сигналам платформы (перезапуск/деплой).
function shutdown(signal) {
  console.info(`[server] ${signal} — завершение`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref(); // форс-выход, если close «завис»
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Не скрываем критические ошибки; в лог — только техническое сообщение (без ПДн/токенов).
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandledRejection:', reason instanceof Error ? reason.message : String(reason));
});
process.on('uncaughtException', (err) => {
  console.error('[fatal] uncaughtException:', err && err.message);
  process.exit(1);
});
