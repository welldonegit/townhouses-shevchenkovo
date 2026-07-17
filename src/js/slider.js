// Слайдер будинків: рендер карток, drag-to-scroll, prev/next, прогрес, лічильник.
import { HOUSES, SECTION_MAP, PLANS } from './data.js';
import { openHouse } from './modal.js';

export function initSlider() {
  const track = document.querySelector('.track');
  if (!track) return;
  const countEl = document.querySelector('.s-count b');
  const thumb = document.querySelector('.s-thumb');
  const prevBtn = document.querySelector('.s-btn[data-prev]');
  const nextBtn = document.querySelector('.s-btn[data-next]');

  const units = SECTION_MAP.map((hi, k) => ({
    no: '№ ' + String(k + 1).padStart(2, '0'),
    area: HOUSES[hi].area, spec: HOUSES[hi].spec, plan: PLANS[hi][0], hi,
  }));

  const drag = { active: false, x: 0, left: 0, moved: false };
  units.forEach((u) => {
    const card = buildCard(u);
    card.addEventListener('click', () => { if (!drag.moved) openHouse(u.hi); });
    track.appendChild(card);
  });

  const stepSize = () => {
    const first = track.querySelector('.hcard');
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
    return first ? first.offsetWidth + gap : 320;
  };
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const ratio = Math.min(track.clientWidth / track.scrollWidth, 1);
    const p = max > 2 ? track.scrollLeft / max : 0;
    const idx = Math.min(Math.max(Math.round(track.scrollLeft / stepSize()) + 1, 1), SECTION_MAP.length);
    if (countEl) countEl.textContent = String(idx).padStart(2, '0');
    if (thumb) {
      thumb.style.width = (ratio * 100).toFixed(1) + '%';
      thumb.style.left = (p * (100 - ratio * 100)).toFixed(1) + '%';
    }
    if (prevBtn) prevBtn.disabled = track.scrollLeft <= 2;
    if (nextBtn) nextBtn.disabled = track.scrollLeft >= max - 2;
  };

  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
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

  setTimeout(update, 80);
  update();
}

function buildCard(u) {
  const card = document.createElement('div');
  card.className = 'hcard';
  card.innerHTML =
    `<img src="${u.plan}" alt="Планування, секція ${u.no}" draggable="false">` +
    `<div class="hcard-eb">Секція ${u.no}</div>` +
    '<div class="hcard-b">' +
      '<div class="hcard-t">' +
        `<div class="a">${u.area}<small>м²</small></div>` +
        `<div class="s">${u.spec}</div>` +
      '</div>' +
      '<span class="hcard-go"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3.4v9.2M3.4 8h9.2" stroke="#F8F4EC" stroke-width="1.6" stroke-linecap="round"></path></svg></span>' +
    '</div>';
  return card;
}
