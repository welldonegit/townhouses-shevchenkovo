// Точка входа. Инициализирует все модули один раз после готовности DOM.
import { captureUtm } from './utm.js';
import { initModal, handleEscape } from './modal.js';
import { initNavigation, isMenuOpen, closeMenu } from './navigation.js';
import { initSlider } from './slider.js';
import { initHeroSlider } from './hero-slider.js';
import { initGenplan } from './genplan.js';
import { initTabs } from './tabs.js';
import { initPhoneInputs } from './phone-input.js';
import { initForms } from './form.js';
import { initEffects } from './effects.js';
// Виджет мессенджеров временно скрыт. Чтобы вернуть — раскомментировать
// этот импорт и вызов initContactWidget() в init(). Стили и разметка
// (contact-widget.css / contact-widget.js) остаются на месте нетронутыми.
// import { initContactWidget } from './contact-widget.js';

function init() {
  captureUtm();
  initModal();       // раньше навигации (updateScrollLock) и slider/genplan (openHouse)
  initNavigation();
  initSlider();
  initHeroSlider();  // тільки на сторінках, де в героя є [data-hero-slider]
  initGenplan();
  initTabs();
  initPhoneInputs(); // маска + UI-валидация телефонов до навешивания submit
  initForms();
  initEffects();
  // initContactWidget();  // временно отключён — см. комментарий у импорта

  // Единый обработчик Escape (стек как в исходнике: зум → лід → будинок → меню).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (handleEscape()) return;
    if (isMenuOpen()) closeMenu();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
