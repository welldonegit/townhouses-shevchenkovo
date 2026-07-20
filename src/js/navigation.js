// Навигация: мобильное меню, ссылки-заглушки, плавная прокрутка к секции будинків.
import { updateScrollLock } from './modal.js';

export function initNavigation() {
  const burger = document.querySelector('.navbtn');
  const menu = document.querySelector('.mm');
  const scrim = document.querySelector('.mm-scrim');

  const setMenu = (open) => {
    burger && burger.classList.toggle('open', open);
    menu && menu.classList.toggle('open', open);
    scrim && scrim.classList.toggle('open', open);
    updateScrollLock();
  };

  burger && burger.addEventListener('click', (e) => {
    e.preventDefault();
    setMenu(!(menu && menu.classList.contains('open')));
  });
  document.querySelectorAll('.mm-close, .mm-scrim').forEach((el) =>
    el.addEventListener('click', (e) => { e.preventDefault(); setMenu(false); }));

  // Ссылки-«заглушки»: как в исходнике — клик гасится, без прокрутки.
  document.querySelectorAll('[data-noscroll]').forEach((a) =>
    a.addEventListener('click', (e) => e.preventDefault()));

  // Hero «Переглянути будинки» — плавная прокрутка к #houses с отступом 80px.
  document.querySelectorAll('[data-scroll-houses]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const el = document.getElementById('houses');
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }));

  // Навигация по секциям: плавный якорный скролл с учётом высоты залипающей шапки.
  const headerEl = document.querySelector('.hdr');
  const scrollToTarget = (hash) => {
    if (!hash || hash === '#' || hash === '#top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.querySelector(hash);
    if (!el) return;
    const offset = headerEl ? headerEl.offsetHeight : 0;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  };
  document.querySelectorAll('[data-scroll]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      setMenu(false); // закрыть мобильное меню, если открыто
      scrollToTarget(a.getAttribute('href'));
    }));

  // Заход по ссылке вида «/#advantages» (например, со страницы подяки): доскролл
  // к нужной секции с учётом высоты залипающей шапки, после полной загрузки макета.
  const initialHash = window.location.hash;
  if (initialHash && initialHash.length > 1) {
    let target = null;
    try { target = document.querySelector(initialHash); } catch { target = null; }
    if (target || initialHash === '#top') {
      const go = () => scrollToTarget(initialHash);
      if (document.readyState === 'complete') setTimeout(go, 80);
      else window.addEventListener('load', () => setTimeout(go, 80), { once: true });
    }
  }
}

export function isMenuOpen() {
  const m = document.querySelector('.mm');
  return !!(m && m.classList.contains('open'));
}

export function closeMenu() {
  const burger = document.querySelector('.navbtn');
  const menu = document.querySelector('.mm');
  const scrim = document.querySelector('.mm-scrim');
  burger && burger.classList.remove('open');
  menu && menu.classList.remove('open');
  scrim && scrim.classList.remove('open');
  updateScrollLock();
}
