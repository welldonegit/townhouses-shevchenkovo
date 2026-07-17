// Логика форм заявки: frontend-валидация + сбор данных с UTM.
// Реальная отправка на backend подключается на этапе 7 (тут — подготовка payload).
import { getUtm } from './utm.js';

export function initForms() {
  document.querySelectorAll('.lform, .mform').forEach((form) => {
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = form.querySelector('[name="name"]');
      const phoneInput = form.querySelector('[name="phone"]');

      const nameOk = !nameInput || nameInput.value.trim().length > 0;
      const phoneOk = !!phoneInput && validPhone(phoneInput.value);
      if (!nameOk || !phoneOk) {
        const firstInvalid = !phoneOk ? phoneInput : nameInput;
        firstInvalid && firstInvalid.focus();
        return;
      }

      const payload = {
        formType: form.dataset.leadType || 'unknown',
        name: nameInput ? nameInput.value.trim() : '',
        phone: phoneInput.value.trim(),
        page: window.location.pathname,
        ...getUtm(),
      };

      // Заглушка отправки: событие + лог. Backend/Telegram/Pipedrive — этапы 7–11.
      document.dispatchEvent(new CustomEvent('lead:submit', { detail: payload }));
      console.info('[lead] payload готов к отправке (этап 7):', payload);
    });
  });
}

function validPhone(value) {
  const digits = (value || '').replace(/\D/g, '');
  return digits.length >= 9;
}
