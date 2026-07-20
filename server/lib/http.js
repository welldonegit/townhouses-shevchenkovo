// HTTP-клиент для внешних запросов на вставленном в Node модуле https/http.
// НЕ используем глобальный fetch (undici): он инстанциирует WASM-парсер (llhttp),
// который на хостинге с жёстким лимитом памяти падает "Out of memory" и роняет
// процесс. Модули http/https используют нативный парсер — без WASM.
// Интерфейс совместим с fetch (ok/status/json/text), поэтому сервисы не меняются.
import http from 'http';
import https from 'https';

// maxRedirects: модули http/https, в отличие от fetch, редиректы не следуют.
// Это нужно Google Apps Script — на doPost он отвечает 302 на googleusercontent.com.
// Таймаут применяется к каждому переходу отдельно, не ко всей цепочке.
export function fetchWithTimeout(url, options = {}, timeoutMs = 8000, maxRedirects = 5) {
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
    const method = options.method || 'GET';
    if (options.body != null && headers['Content-Length'] == null) {
      headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = lib.request(
      u,
      { method, headers, timeout: timeoutMs },
      (res) => {
        const loc = res.headers.location;
        if (res.statusCode >= 300 && res.statusCode < 400 && loc && maxRedirects > 0) {
          res.resume(); // освобождаем сокет, тело редиректа не нужно
          // 301/302/303 после POST превращаются в GET без тела (как делает fetch
          // и браузер); 307/308 сохраняют метод и тело.
          const keepMethod = res.statusCode === 307 || res.statusCode === 308;
          const nextHeaders = { ...headers };
          if (!keepMethod) {
            delete nextHeaders['Content-Length'];
            delete nextHeaders['Content-Type'];
          }
          fetchWithTimeout(
            new URL(loc, u).toString(),
            {
              method: keepMethod ? method : 'GET',
              headers: nextHeaders,
              body: keepMethod ? options.body : undefined,
            },
            timeoutMs,
            maxRedirects - 1,
          ).then(resolve, reject);
          return;
        }
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
