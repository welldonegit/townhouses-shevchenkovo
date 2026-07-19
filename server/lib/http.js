// HTTP-клиент для внешних запросов на вставленном в Node модуле https/http.
// НЕ используем глобальный fetch (undici): он инстанциирует WASM-парсер (llhttp),
// который на хостинге с жёстким лимитом памяти падает "Out of memory" и роняет
// процесс. Модули http/https используют нативный парсер — без WASM.
// Интерфейс совместим с fetch (ok/status/json/text), поэтому сервисы не меняются.
import http from 'http';
import https from 'https';

export function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(url);
    } catch (e) {
      reject(e);
      return;
    }
    const lib = u.protocol === 'http:' ? http : https;
    const headers = { ...(options.headers || {}) };
    if (options.body != null && headers['Content-Length'] == null) {
      headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = lib.request(
      u,
      { method: options.method || 'GET', headers, timeout: timeoutMs },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: async () => JSON.parse(data),
            text: async () => data,
          });
        });
      },
    );

    req.on('timeout', () => {
      // Имя AbortError — чтобы вызывающий код отличил таймаут от сетевой ошибки.
      const err = new Error('request timeout');
      err.name = 'AbortError';
      req.destroy(err);
    });
    req.on('error', (err) => reject(err));

    if (options.body != null) req.write(options.body);
    req.end();
  });
}
