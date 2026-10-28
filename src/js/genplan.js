// Хотспоти генплану (таунхауси desktop/mobile + дуплекси) → відкриття модалки будинку.
// Таби перемикають генплани; розмітка табів спільна з блоком ремонту (.rl-tab).
import { GP_POS, GP_POS_MOB, GP_NO, SECTION_MAP, DP_POS, DP_POS_MOB, DP_NO, statusOf, STATUS_LABELS } from './data.js';
import { openHouse } from './modal.js';

export function initGenplan() {
  // Таунхауси: номер секції на генплані → індекс типу будинку.
  const openTown = (k) => {
    const section = GP_NO[k];
    openHouse(SECTION_MAP[section - 1], 'houses', { section, status: statusOf(section) });
  };
  renderSpots(document.querySelector('.gp-desk'), GP_POS, GP_NO, openTown, statusOf);
  renderSpots(document.querySelector('.gp-mob'), GP_POS_MOB, GP_NO, openTown, statusOf);

  // Дуплекси: кожен хотспот — окрема секція, індекс збігається з порядком DP_POS.
  const openDuplex = (k) => openHouse(k, 'duplex');
  renderSpots(document.querySelector('.gp-dup-desk'), DP_POS, DP_NO, openDuplex);
  renderSpots(document.querySelector('.gp-dup-mob'), DP_POS_MOB, DP_NO, openDuplex);

  initGenplanTabs();
}

// status: статус секції для цієї колекції — 'sold' | 'reserved' | '' (у дуплексів статусів немає).
function renderSpots(stage, positions, numbers, onPick, status = () => '') {
  if (!stage) return;
  positions.forEach((p, k) => {
    const st = status(numbers[k]);
    const isDone = !!st;
    const btn = document.createElement('button');
    btn.className = isDone ? 'gp-spot ' + st : 'gp-spot';
    btn.style.left = p[0]; btn.style.top = p[1];
    btn.style.width = p[2]; btn.style.height = p[3];
    btn.innerHTML =
      `<span class="gp-badge">${String(numbers[k]).padStart(2, '0')}</span>` +
      (isDone ? `<span class="gp-more">${STATUS_LABELS[st]}</span>` : '<span class="gp-more">Детальніше</span>');
    // Продана / заброньована секція — не клікабельна, планування з генплану не відкривається.
    if (isDone) { btn.disabled = true; return void stage.appendChild(btn); }
    btn.addEventListener('click', () => onPick(k));
    stage.appendChild(btn);
  });
}

function initGenplanTabs() {
  const tabs = document.querySelectorAll('[data-gp-tab]');
  if (!tabs.length) return;
  const panes = document.querySelectorAll('[data-gp-pane]');

  tabs.forEach((tab) => tab.addEventListener('click', () => {
    const key = tab.getAttribute('data-gp-tab');
    tabs.forEach((t) => t.classList.toggle('on', t === tab));
    panes.forEach((p) => p.classList.toggle('on', p.getAttribute('data-gp-pane') === key));
  }));
}
