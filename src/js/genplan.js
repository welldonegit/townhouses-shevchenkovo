// Хотспоти генплану (desktop/mobile) → відкриття модалки будинку.
import { GP_POS, GP_POS_MOB, GP_NO, SECTION_MAP } from './data.js';
import { openHouse } from './modal.js';

export function initGenplan() {
  renderSpots(document.querySelector('.gp-desk'), GP_POS);
  renderSpots(document.querySelector('.gp-mob'), GP_POS_MOB);
}

function renderSpots(stage, positions) {
  if (!stage) return;
  positions.forEach((p, k) => {
    const hi = SECTION_MAP[GP_NO[k] - 1];
    const btn = document.createElement('button');
    btn.className = 'gp-spot';
    btn.style.left = p[0]; btn.style.top = p[1];
    btn.style.width = p[2]; btn.style.height = p[3];
    btn.innerHTML =
      `<span class="gp-badge">${String(GP_NO[k]).padStart(2, '0')}</span>` +
      '<span class="gp-more">Детальніше</span>';
    btn.addEventListener('click', () => openHouse(hi));
    stage.appendChild(btn);
  });
}
