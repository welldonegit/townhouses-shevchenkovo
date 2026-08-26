// Плаваюча кнопка «Підібрати дім»: закріплена внизу екрана й з’являється,
// щойно користувач прокрутив перший екран (герой). Відкриття лід-модалки
// вішає modal.js за атрибутом data-lead — тут лише показ/приховування.

// Поки герой не змірявся (немає секції), орієнтир — висота вікна.
function threshold(hero) {
  if (!hero) return window.innerHeight * 0.9;
  const r = hero.getBoundingClientRect();
  return r.bottom + window.scrollY;
}

export function initStickyCta() {
  const btn = document.querySelector('[data-sticky-cta]');
  if (!btn) return;
  const hero = document.querySelector('.hero');

  let ticking = false;
  let cur = false;
  const update = () => {
    ticking = false;
    const show = window.scrollY > threshold(hero);
    if (show === cur) return;
    cur = show;
    btn.classList.toggle('on', show);
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  // Ховаємо кнопку, поки відкритий модал/меню (body отримує overflow:hidden) —
  // так само, як це робить віджет месенджерів.
  const sync = () => {
    btn.classList.toggle('cta-off', document.body.style.overflow === 'hidden');
  };
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['style'] });
  sync();
}
