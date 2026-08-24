// Слайдер будинків: рендер карток, drag-to-scroll, prev/next, прогрес, лічильник.
// Таби перемикають колекції (усі будинки / таунхауси / дуплекси); розмітка табів спільна з блоком ремонту.
import { HOUSES, SECTION_MAP, PLANS, DUPLEXES, DUPLEX_PLANS, isSold, priceOf } from './data.js';
import { openHouse } from './modal.js';

// Секція генплану → тип будинку (кілька секцій можуть мати однакове планування).
const townUnits = () => SECTION_MAP.map((hi, k) => {
  const section = k + 1;
  const sold = isSold(section);
  return {
    no: '№ ' + String(section).padStart(2, '0'),
    type: 'Таунхаус', sold,
    // Ціна — по номеру секції; на проданих її не показуємо.
    area: HOUSES[hi].area, price: sold ? '' : priceOf(section),
    spec: HOUSES[hi].spec, plan: PLANS[hi][0],
    open: () => openHouse(hi, 'houses', { sold, section }),
  };
});

const duplexUnits = () => DUPLEXES.map((d, k) => ({
  no: d.sections,
  type: 'Дуплекс', sold: false,
  area: d.area, price: d.price, spec: d.spec, plan: DUPLEX_PLANS[k][0],
  open: () => openHouse(k, 'duplex'),
}));

// Кожна колекція дає свій набір карток і свій підзаголовок над слайдером.
const COLLECTIONS = {
  all: {
    desc: 'Таунхауси від 47,88 до 63,20 м² та дуплекси по 75,60 м². Оберіть секцію та відкрийте планування.',
    units: () => [...townUnits(), ...duplexUnits()],
  },
  towns: {
    desc: 'Усі будинки рівноцінні — від 47,88 до 63,20 м². Оберіть секцію та відкрийте планування.',
    units: townUnits,
  },
  duplex: {
    desc: 'Вісім секцій по 75,60 м² — з двома або трьома спальнями. Оберіть секцію та відкрийте планування.',
    units: duplexUnits,
  },
};

export function initSlider() {
  const track = document.querySelector('.track');
  if (!track) return;
  const countEl = document.querySelector('.s-count b');
  const totalEl = document.querySelector('[data-s-total]');
  const descEl = document.querySelector('[data-h-desc]');
  const thumb = document.querySelector('.s-thumb');
  const prevBtn = document.querySelector('.s-btn[data-prev]');
  const nextBtn = document.querySelector('.s-btn[data-next]');
  const tabs = document.querySelectorAll('[data-h-tab]');

  const drag = { active: false, x: 0, left: 0, moved: false };
  let units = [];

  const stepSize = () => {
    const first = track.querySelector('.hcard');
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
    return first ? first.offsetWidth + gap : 320;
  };
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const ratio = Math.min(track.clientWidth / track.scrollWidth, 1);
    const p = max > 2 ? track.scrollLeft / max : 0;
    const idx = Math.min(Math.max(Math.round(track.scrollLeft / stepSize()) + 1, 1), units.length);
    if (countEl) countEl.textContent = String(idx).padStart(2, '0');
    if (thumb) {
      thumb.style.width = (ratio * 100).toFixed(1) + '%';
      thumb.style.left = (p * (100 - ratio * 100)).toFixed(1) + '%';
    }
    if (prevBtn) prevBtn.disabled = track.scrollLeft <= 2;
    if (nextBtn) nextBtn.disabled = track.scrollLeft >= max - 2;
  };

  // Перемальовує картки під обрану колекцію та повертає слайдер на початок.
  const render = (key) => {
    const c = COLLECTIONS[key] || COLLECTIONS.all;
    units = c.units();
    track.replaceChildren(...units.map((u) => {
      const card = buildCard(u);
      card.addEventListener('click', () => { if (!drag.moved) u.open(); });
      return card;
    }));
    if (descEl) descEl.textContent = c.desc;
    if (totalEl) totalEl.textContent = String(units.length).padStart(2, '0');
    // scroll-behavior:smooth анімував би перемотку на початок при зміні таба.
    const behavior = track.style.scrollBehavior;
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = 0;
    track.style.scrollBehavior = behavior;
    update();
  };

  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.toggle('on', t === tab));
    render(tab.getAttribute('data-h-tab'));
  }));
  prevBtn && prevBtn.addEventListener('click', () => track.scrollBy({ left: -stepSize(), behavior: 'smooth' }));
  nextBtn && nextBtn.addEventListener('click', () => track.scrollBy({ left: stepSize(), behavior: 'smooth' }));

  track.addEventListener('pointerdown', (e) => {
    drag.active = true; drag.x = e.clientX; drag.left = track.scrollLeft; drag.moved = false;
    track.classList.add('drag');
  });
  track.addEventListener('pointermove', (e) => {
    if (!drag.active) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    track.scrollLeft = drag.left - dx;
  });
  const up = () => {
    if (!drag.active) return;
    drag.active = false;
    track.classList.remove('drag');
    setTimeout(() => { drag.moved = false; }, 0);
  };
  track.addEventListener('pointerup', up);
  track.addEventListener('pointerleave', up);

  // Стартова колекція — активний таб. На сторінках без табів (бойова головна,
  // де дуплексів поки немає) це таунхауси.
  const startTab = document.querySelector('[data-h-tab].on');
  render(startTab ? startTab.getAttribute('data-h-tab') : 'towns');
  setTimeout(update, 80);
}

function buildCard(u) {
  const card = document.createElement('div');
  card.className = 'hcard';
  card.innerHTML =
    `<img src="${u.plan}" alt="Планування, секція ${u.no}" draggable="false">` +
    `<div class="hcard-eb">Секція ${u.no}</div>` +
    '<div class="hcard-tags">' +
      `<span class="hcard-tag">${u.type}</span>` +
      (u.sold ? '<span class="hcard-tag sold">Продано</span>' : '') +
    '</div>' +
    '<div class="hcard-b">' +
      '<div class="hcard-t">' +
        `<div class="a">${u.area}<small>м²</small></div>` +
        (u.price ? `<div class="p">${u.price}</div>` : '') +
        `<div class="s">${u.spec}</div>` +
      '</div>' +
      '<span class="hcard-go"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3.4v9.2M3.4 8h9.2" stroke="#F8F4EC" stroke-width="1.6" stroke-linecap="round"></path></svg></span>' +
    '</div>';
  return card;
}
