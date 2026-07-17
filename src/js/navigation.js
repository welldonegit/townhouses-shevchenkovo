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
