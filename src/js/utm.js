// Сбор и хранение UTM-меток на 30 дней (localStorage с TTL).
const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const STORE_KEY = 'utm_data';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Читает UTM из URL и, если они есть, перезаписывает сохранённые (last-touch).
export function captureUtm() {
  try {
    const params = new URLSearchParams(window.location.search);
    const found = {};
    for (const k of KEYS) {
      const v = params.get(k);
      if (v) found[k] = v;
    }
    if (Object.keys(found).length) {
      localStorage.setItem(STORE_KEY, JSON.stringify({ data: found, ts: Date.now() }));
    }
  } catch {
    /* localStorage может быть недоступен (приватный режим) — молча пропускаем */
  }
}

// Возвращает сохранённые UTM, если им меньше 30 дней; иначе {} (и чистит просроченное).
export function getUtm() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.ts || Date.now() - parsed.ts > TTL_MS) {
      localStorage.removeItem(STORE_KEY);
      return {};
    }
    return parsed.data || {};
  } catch {
    return {};
  }
}
