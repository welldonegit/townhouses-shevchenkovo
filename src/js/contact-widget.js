// Плавающий виджет связи: телефон + мессенджеры.
// Иконки строятся из CONTACTS — пустой слот не выводится. Разметка инжектится в
// body, поэтому виджет присутствует на всех страницах (index и /thanks/).
import { CONTACTS } from './data.js';

// Иконки в порядке дизайна. blank=true — внешняя веб-ссылка (новая вкладка).
// svg — статичная разметка (без пользовательских данных), поэтому innerHTML безопасен.
const ICONS = [
  { key: 'phone', cls: 'mi-phone', label: 'Телефон', blank: false,
    href: (v) => 'tel:+' + String(v).replace(/\D/g, ''),
    svg: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M20 15.5a12.6 12.6 0 0 1-3.9-.6 1.1 1.1 0 0 0-1.1.27l-1.72 1.72a16.5 16.5 0 0 1-7.17-7.17l1.72-1.72a1.1 1.1 0 0 0 .27-1.1A12.6 12.6 0 0 1 7.5 3.9 1.1 1.1 0 0 0 6.4 3H3.6A1.1 1.1 0 0 0 2.5 4.1 17.4 17.4 0 0 0 19.9 21.5 1.1 1.1 0 0 0 21 20.4v-2.8a1.1 1.1 0 0 0-1-1.1z"/></svg>' },
  { key: 'telegram', cls: 'mi-tg', label: 'Telegram', blank: true, href: (v) => v,
    svg: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M21.9 4.3 2.9 11.64c-1.14.44-1.13 1.08-.2 1.36l4.86 1.52 1.78 5.6c.23.63.42.63 1 .63.36 0 .66-.2.93-.47l2.3-2.24 4.78 3.53c.88.49 1.5.24 1.72-.81l3.11-14.7c.32-1.28-.48-1.86-1.31-1.48z"/></svg>' },
  { key: 'viber', cls: 'mi-viber', label: 'Viber', blank: false, href: (v) => v,
    svg: '<img src="/assets/viber-color.svg" alt="" draggable="false">' },
  { key: 'whatsapp', cls: 'mi-wa', label: 'WhatsApp', blank: true, href: (v) => v,
    svg: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 3.2a8.8 8.8 0 0 0-7.5 13.4L3 21l4.6-1.45A8.8 8.8 0 1 0 12 3.2zm5.1 12.5c-.22.6-1.25 1.12-1.72 1.19-.44.06-1 .09-1.6-.1-.37-.11-.85-.27-1.46-.53-2.56-1.1-4.23-3.7-4.36-3.87-.13-.17-1.05-1.4-1.05-2.66 0-1.27.66-1.9.9-2.16.23-.25.5-.31.66-.31h.48c.15 0 .36-.06.56.43l.68 1.66c.07.14.11.31 0 .48l-.3.36-.3.28c-.13.13-.27.27-.11.53.16.26.7 1.15 1.5 1.86 1.03.92 1.9 1.2 2.17 1.34.2.1.32.08.44-.05l.63-.73c.16-.2.32-.16.54-.09l1.66.78c.22.1.36.16.42.24.06.14.06.68-.16 1.28z"/></svg>' },
  { key: 'messenger', cls: 'mi-fb', label: 'Messenger', blank: true, href: (v) => v,
    svg: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2.4C6.65 2.4 2.5 6.32 2.5 11.4c0 2.86 1.32 5.36 3.4 6.99v3.21l3.11-1.71c.83.23 1.71.36 2.63.36h.36c5.35 0 9.5-3.92 9.5-9S17.35 2.4 12 2.4zm.95 11.68-2.42-2.58-4.72 2.58 5.19-5.5 2.48 2.58 4.66-2.58-5.19 5.5z"/></svg>' },
  { key: 'instagram', cls: 'mi-ig', label: 'Instagram', blank: true, href: (v) => v,
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3.8" y="3.8" width="16.4" height="16.4" rx="5"></rect><circle cx="12" cy="12" r="3.7"></circle><circle cx="16.7" cy="7.3" r="1.15" fill="#fff" stroke="none"></circle></svg>',
  },
];

const TOGGLE_SVG =
  '<span class="msgr-ic msgr-ic-chat"><svg viewBox="0 0 24 24" fill="none"><path d="M4 5.7A1.7 1.7 0 0 1 5.7 4h12.6A1.7 1.7 0 0 1 20 5.7v8.2a1.7 1.7 0 0 1-1.7 1.7H9.2L5 19.4v-3.8h.7A1.7 1.7 0 0 1 4 13.9z" fill="#F5F2EA"></path><path d="M8.2 8.7h7.6M8.2 11.7h4.8" stroke="#294239" stroke-width="1.7" stroke-linecap="round"></path></svg></span>' +
  '<span class="msgr-ic msgr-ic-close"><i></i><i></i></span>';

export function initContactWidget() {
  if (document.querySelector('.msgr')) return; // не дублируем
  const items = ICONS.filter((ic) => CONTACTS[ic.key]); // пустой слот — не выводим
  if (!items.length) return;

  const wrap = document.createElement('div');
  wrap.className = 'msgr';

  const list = document.createElement('div');
  list.className = 'msgr-list';
  items.forEach((ic) => {
    const a = document.createElement('a');
    a.className = 'msgr-i ' + ic.cls;
    a.href = ic.href(CONTACTS[ic.key]);
    a.setAttribute('aria-label', ic.label);
    if (ic.blank) { a.target = '_blank'; a.rel = 'noopener'; }
    a.innerHTML = ic.svg;
    list.appendChild(a);
  });

  const toggle = document.createElement('button');
  toggle.className = 'msgr-toggle';
  toggle.setAttribute('aria-label', "Зв'язатися");
  toggle.innerHTML = TOGGLE_SVG;
  toggle.addEventListener('click', (e) => { e.preventDefault(); wrap.classList.toggle('open'); });

  wrap.append(list, toggle);
  document.body.appendChild(wrap);

  const close = () => wrap.classList.remove('open');

  // Клик вне виджета / Escape — закрыть.
  document.addEventListener('click', (e) => {
    if (wrap.classList.contains('open') && !wrap.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // Прячем виджет, пока открыт модал/меню (body получает overflow:hidden).
  const sync = () => {
    const locked = document.body.style.overflow === 'hidden';
    wrap.classList.toggle('msgr-off', locked);
    if (locked) close();
  };
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['style'] });
}
