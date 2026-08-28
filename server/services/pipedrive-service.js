// Интеграция с Pipedrive (второй независимый канал доставки).
// Нативный fetch, без SDK. Поток: поиск Person → создание Person → создание Deal
// в заданных воронке/этапе → Note. Успех = реально созданная Deal. Логи — только
// op/status/код/dealId, без URL (в query token), без токена и без ПДн клиента.
import { config } from '../config/env.js';
import { fetchWithTimeout } from '../lib/http.js';
import { formLabel, fieldLabel } from './telegram-service.js';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

export async function sendToPipedrive(data, submissionId) {
  const cfg = config.pipedrive;
  if (!cfg.apiToken || !cfg.companyDomain) return { ok: false, error: 'not_configured' };

  const email = data.fields && data.fields.email ? data.fields.email : '';
  try {
    // 1. Поиск Person по нормализованному телефону (точное совпадение).
    let person = matchByPhone(await search(data.phone, 'phone'), data.phone);
    // 2. Если нет и есть email — отдельный поиск по email.
    if (!person && email) person = matchByEmail(await search(email, 'email'), email);
    // 3. Если точного совпадения нет — создаём Person.
    if (!person) person = await createPerson(data, email);
    if (!person || !person.id) return { ok: false, error: 'person_failed' };

    // 4. Создание Deal, связанной с Person (это и есть критерий успеха).
    const deal = await createDeal(data, person.id);
    if (!deal || !deal.id) return { ok: false, error: 'deal_failed' };

    // 5. Note с доп. данными — ошибка не отменяет успех Deal.
    try {
      await createNote(deal.id, data, submissionId);
    } catch (noteErr) {
      console.warn('[pipedrive]', { op: 'note_create', dealId: deal.id, status: noteErr.status || 0, error: noteErr.code || 'note_failed' });
    }

    return { ok: true, dealId: deal.id };
  } catch (err) {
    console.warn('[pipedrive]', { op: err.op || 'pipedrive', status: err.status || 0, error: err.code || 'error' });
    return { ok: false, error: `${err.op || 'pipedrive'}_${err.code || 'error'}` };
  }
}

// ── HTTP-обёртка ────────────────────────────────────────────────────────
// URL (с token в query) НИКОГДА не логируется и не возвращается наружу.
async function call(op, method, apiPath, body) {
  const cfg = config.pipedrive;
  const url = `${cfg.apiBase}${apiPath}${apiPath.includes('?') ? '&' : '?'}api_token=${cfg.apiToken}`;
  let res;
  try {
    res = await fetchWithTimeout(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }, cfg.timeoutMs);
  } catch (err) {
    throw pdError(op, 0, err && err.name === 'AbortError' ? 'timeout' : 'network');
  }
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  if (!res.ok || !json || json.success === false) throw pdError(op, res.status, 'http');
  return json.data;
}

function pdError(op, status, code) {
  const e = new Error(`${op}_${code}`);
  e.op = op; e.status = status; e.code = code;
  return e;
}

// ── Person ──────────────────────────────────────────────────────────────
async function search(term, field) {
  const q = `term=${encodeURIComponent(term)}&fields=${field}&exact_match=true&limit=10`;
  const data = await call('person_search', 'GET', `/api/v2/persons/search?${q}`);
  return (data && data.items) || [];
}

const digits = (s) => String(s || '').replace(/\D/g, '');

// Не берём первый результат вслепую — проверяем точное совпадение в данных Person.
function matchByPhone(items, phone) {
  const d = digits(phone);
  for (const it of items) {
    const p = it.item || it;
    const phones = p.phones || [];
    if (phones.some((x) => digits(typeof x === 'string' ? x : (x && x.value)) === d)) return p;
  }
  return null;
}
function matchByEmail(items, email) {
  const e = email.toLowerCase();
  for (const it of items) {
    const p = it.item || it;
    const emails = p.emails || [];
    if (emails.some((x) => String(typeof x === 'string' ? x : (x && x.value) || '').toLowerCase() === e)) return p;
  }
  return null;
}

async function createPerson(data, email) {
  const name = (data.fields && data.fields.name) || data.phone;
  const body = { name, phones: [{ value: data.phone, primary: true, label: 'mobile' }] };
  if (email) body.emails = [{ value: email, primary: true, label: 'work' }];
  return call('person_create', 'POST', '/api/v2/persons', body);
}

// ── Deal (v2: кастомные поля — объект custom_fields по hash-ключу) ──────
// Именно v2: в v1 кастомные поля кладутся на верхний уровень тела, а объект
// custom_fields там молча игнорируется. Имена полей в v2 тоже свои:
// владелец — owner_id (в v1 был user_id), метки — label_ids массивом (в v1 label).
async function createDeal(data, personId) {
  const cfg = config.pipedrive;

  // Тайтл сделки. formLabel — общая с Telegram подпись формы (её не меняем);
  // имя клиента в тайтл не выносим, оно видно в связанном Person.
  const body = {
    title: `Сайт Тауни: ${formLabel(data)}`,
    person_id: personId,
  };
  if (cfg.pipelineId) body.pipeline_id = Number(cfg.pipelineId);
  if (cfg.stageId) body.stage_id = Number(cfg.stageId);
  if (cfg.ownerId) body.owner_id = Number(cfg.ownerId);
  if (cfg.labelIds.length) body.label_ids = cfg.labelIds;

  // UTM и Google Client ID попадают в поле сделки, только если для метки задан
  // её hash-ключ. Пришло значение, а ключа нет — молчаливая потеря данных,
  // поэтому логируем: в Note оно всё равно окажется, но полем не станет.
  const customFields = {};
  const noFieldKey = [];
  const entries = [
    ...UTM_KEYS.map((key) => [key, data.utm && data.utm[key]]),
    ['ga_client_id', data.gaClientId],
  ];
  for (const [key, value] of entries) {
    if (!value) continue; // пустые значения не отправляем
    const fieldKey = cfg.fieldKeys[key];
    if (fieldKey) customFields[fieldKey] = value;
    else noFieldKey.push(key);
  }
  if (noFieldKey.length) {
    console.warn('[pipedrive]', { op: 'deal_create', error: 'field_key_missing', keys: noFieldKey.join(',') });
  }
  if (Object.keys(customFields).length) body.custom_fields = customFields;

  return call('deal_create', 'POST', '/api/v2/deals', body);
}

// ── Note (безопасный HTML) ──────────────────────────────────────────────
const escapeHtml = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

async function createNote(dealId, data, submissionId) {
  const f = data.fields || {};
  const u = data.utm || {};
  // house уже вошёл в строку «Форма» — отдельной строкой не дублируем.
  const skip = new Set(['name', 'phone', 'email', 'house']);
  const lines = [`<b>Форма:</b> ${escapeHtml(formLabel(data))}`];
  for (const [k, v] of Object.entries(f)) {
    if (!skip.has(k)) lines.push(`<b>${escapeHtml(fieldLabel(k))}:</b> ${escapeHtml(v)}`);
  }
  lines.push(`<b>Сторінка:</b> ${escapeHtml(data.page || '')}`);
  lines.push('<b>UTM:</b>');
  for (const key of UTM_KEYS) lines.push(`${key}: ${escapeHtml(u[key] || '')}`);
  lines.push(`<b>Google Client ID:</b> ${escapeHtml(data.gaClientId || '')}`);
  lines.push(`<b>ID заявки:</b> ${escapeHtml(submissionId)}`);
  const content = lines.join('<br>');
  return call('note_create', 'POST', '/api/v1/notes', { content, deal_id: dealId });
}
