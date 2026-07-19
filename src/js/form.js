// Отправка форм заявки на единый endpoint POST /api/leads.
// Все поля формы (FormData) + UTM. Loading-состояние, запрет повторной отправки,
// сообщение об ошибке, редирект на страницу подяки только при реальном успехе.
import { getUtm } from './utm.js';
import { validatePhone } from './phone-input.js';

const SUBMIT_ERROR = 'Не вдалося надіслати заявку. Спробуйте ще раз пізніше.';
const errorEls = new Map();

export function initForms() {
  document.querySelectorAll('.lform, .mform').forEach((form) => {
    form.setAttribute('novalidate', '');
    const err = document.createElement('div');
    err.className = 'form-error';
    err.style.display = 'none';
    form.appendChild(err);
    errorEls.set(form, err);
    form.addEventListener('submit', (e) => onSubmit(e, form));
  });
}

async function onSubmit(e, form) {
  e.preventDefault();
  console.log('еще одна проверка'); // маркер: подтверждает, что на проде свежий фронт-код
  if (form.dataset.busy) return; // не допускаем повторную отправку
  hideError(form);

  const nameInput = form.querySelector('[name="name"]');
  const phoneInput = form.querySelector('[name="phone"]');
  const nameOk = !nameInput || nameInput.value.trim().length > 0;
  const phoneOk = !!phoneInput && validatePhone(phoneInput);
  if (!nameOk || !phoneOk) {
    (!phoneOk ? phoneInput : nameInput)?.focus();
    return;
  }

  const fields = {};
  new FormData(form).forEach((v, k) => { if (typeof v === 'string') fields[k] = v; });
  const payload = {
    formType: form.dataset.leadType || 'unknown',
    page: window.location.pathname,
    fields,
    utm: getUtm(),
  };

  setBusy(form, true);
  document.dispatchEvent(new CustomEvent('lead:submit', { detail: payload }));
  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json && json.ok === true) {
      document.dispatchEvent(new CustomEvent('lead:success', { detail: payload }));
      redirect(); // уходим на страницу подяки — форму busy не снимаем
      return;
    }
    // Диагностика: код статуса + причина по каналам (без ПДн) — видно в консоли браузера.
    console.warn('[lead] не доставлено:', res.status, (json && (json.channels || json.error)) || '(нет тела ответа)');
    fail(form);
  } catch (err) {
    console.warn('[lead] сетевая ошибка запроса:', err && err.message);
    fail(form); // network error / прерывание — не редиректим, показываем ошибку
  }
}

function fail(form) {
  setBusy(form, false);
  showError(form);
}

function redirect() {
  try { window.location.assign('/thanks/'); } catch { /* напр. в тестовой среде */ }
}

function setBusy(form, busy) {
  if (busy) form.dataset.busy = '1'; else delete form.dataset.busy;
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.disabled = busy;
}

function showError(form) {
  const el = errorEls.get(form);
  if (el) { el.textContent = SUBMIT_ERROR; el.style.display = ''; }
}
function hideError(form) {
  const el = errorEls.get(form);
  if (el) el.style.display = 'none';
}
