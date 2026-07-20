// Ремонт: перемикання «компактні / просторі», галерея, кнопка «Більше зображень».
import { REMONT } from './data.js';
import { openLightbox } from './modal.js';

export function initTabs() {
  const grid = document.querySelector('.rl-set');
  if (!grid) return;
  const tabs = document.querySelectorAll('.rl-tab');
  const moreWrap = document.querySelector('.rl-more');
  const moreBtn = document.querySelector('[data-show-all]');

  let reType = 'compact';
  let showAll = false;
  let anim = 0;

  const render = () => {
    const set = REMONT[reType] || REMONT.compact;
    const visible = showAll ? set : set.slice(0, 8);
    grid.replaceChildren(...visible.map((t, i) => {
      const cell = document.createElement('div');
      cell.className = 'rl-cell';
      const img = document.createElement('img');
      img.src = t.src; img.alt = 'Рендер інтер’єру';
      cell.appendChild(img);
      // Листаем весь набор таба (не только видимые 8); индекс в срезе совпадает с индексом в наборе.
      cell.addEventListener('click', () => openLightbox(set, i));
      return cell;
    }));
    grid.className = 'rl-set on anim-' + (anim % 2);
    const hasMore = !showAll && set.length > 8;
    if (moreWrap) moreWrap.style.display = hasMore ? '' : 'none';
  };

  tabs.forEach((tab) => tab.addEventListener('click', () => {
    // Как в исходнике: клик по табу всегда сбрасывает showAll и триггерит анимацию.
    reType = tab.getAttribute('data-tab');
    showAll = false;
    anim++;
    tabs.forEach((t) => t.classList.toggle('on', t === tab));
    render();
  }));
  moreBtn && moreBtn.addEventListener('click', (e) => { e.preventDefault(); showAll = true; render(); });

  render();
}
