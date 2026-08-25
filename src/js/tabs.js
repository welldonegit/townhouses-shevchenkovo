// Ремонт: перемикання «компактні / просторі», галерея, кнопка «Більше зображень».
import { REMONT } from './data.js';
import { openLightbox } from './modal.js';

export function initTabs() {
  const grid = document.querySelector('.rl-set');
  if (!grid) return;
  // Обов'язково в межах секції: елемент .rl-tab перевикористаний у блоках
  // генплану та планувань, тож глобальний селектор навісив би цей обробник
  // і на їхні таби — вони скидали б активний стан і галерею одне одному.
  const tabs = document.querySelectorAll('.remont .rl-tab');
  const moreWrap = document.querySelector('.rl-more');
  const moreBtn = document.querySelector('[data-show-all]');
  const cta = document.querySelector('.rl-cta');
  // На десктопі плашка ремонту вбудована в сітку останньою коміркою (займає два
  // вільні місця в ряду), тому згорнутий набір — 6 фото замість 8. На планшеті
  // й мобільному вона лишається окремим блоком під галереєю. Якщо плашки в
  // розмітці немає (прихована), десктоп показує всі 8 фото — ряди лишаються повними.
  const desk = window.matchMedia('(min-width:1025px)');

  let reType = 'compact';
  let showAll = false;
  let anim = 0;

  const render = () => {
    const set = REMONT[reType] || REMONT.compact;
    const visible = showAll ? set : set.slice(0, desk.matches && cta ? 6 : 8);
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
    const hasMore = !showAll && visible.length < set.length;
    if (moreWrap) moreWrap.style.display = hasMore ? '' : 'none';
    // replaceChildren щоразу очищає сітку, тому плашку переставляємо після рендера.
    if (cta) (desk.matches ? grid : grid.parentElement).appendChild(cta);
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
  desk.addEventListener('change', render);

  render();
}
