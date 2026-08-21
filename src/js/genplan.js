// Хотспоти генплану (таунхауси desktop/mobile + дуплекси) → відкриття модалки будинку.
// Таби перемикають генплани; розмітка табів спільна з блоком ремонту (.rl-tab).
import { GP_POS, GP_POS_MOB, GP_NO, SECTION_MAP, DP_POS, DP_POS_MOB, DP_NO } from './data.js';
import { openHouse } from './modal.js';

const HINTS = {
  towns: 'Натисніть на дім, щоб побачити планування таунхауса',
  // Длина строки подобрана под фиксированную ширину .gp-hint (432px) — в одну строку.
  duplex: 'Натисніть на дім, щоб побачити планування дуплекса',
};

export function initGenplan() {
  // Таунхауси: номер секції на генплані → індекс типу будинку.
  const openTown = (k) => openHouse(SECTION_MAP[GP_NO[k] - 1]);
  renderSpots(document.querySelector('.gp-desk'), GP_POS, GP_NO, openTown);
  renderSpots(document.querySelector('.gp-mob'), GP_POS_MOB, GP_NO, openTown);

  // Дуплекси: кожен хотспот — окрема секція, індекс збігається з порядком DP_POS.
  const openDuplex = (k) => openHouse(k, 'duplex');
  renderSpots(document.querySelector('.gp-dup-desk'), DP_POS, DP_NO, openDuplex);
  renderSpots(document.querySelector('.gp-dup-mob'), DP_POS_MOB, DP_NO, openDuplex);

  initGenplanTabs();
}

function renderSpots(stage, positions, numbers, onPick) {
  if (!stage) return;
  positions.forEach((p, k) => {
    const btn = document.createElement('button');
    btn.className = 'gp-spot';
    btn.style.left = p[0]; btn.style.top = p[1];
    btn.style.width = p[2]; btn.style.height = p[3];
    btn.innerHTML =
      `<span class="gp-badge">${String(numbers[k]).padStart(2, '0')}</span>` +
      '<span class="gp-more">Детальніше</span>';
    btn.addEventListener('click', () => onPick(k));
    stage.appendChild(btn);
  });
}

function initGenplanTabs() {
  const tabs = document.querySelectorAll('[data-gp-tab]');
  if (!tabs.length) return;
  const panes = document.querySelectorAll('[data-gp-pane]');
  const hint = document.querySelector('[data-gp-hint]');

  tabs.forEach((tab) => tab.addEventListener('click', () => {
    const key = tab.getAttribute('data-gp-tab');
    tabs.forEach((t) => t.classList.toggle('on', t === tab));
    panes.forEach((p) => p.classList.toggle('on', p.getAttribute('data-gp-pane') === key));
    if (hint) hint.textContent = HINTS[key] || HINTS.towns;
  }));
}
