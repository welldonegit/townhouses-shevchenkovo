// Слайдер у героя: автоперемикання кадрів без елементів керування.
// Анімація — бібліотека Motion (motion.dev): крос-фейд + повільний зум (Ken Burns),
// який триває весь показ кадру, тому картинка ніколи не «стоїть».
// motion/mini — WAAPI-збірка бібліотеки (~2 КБ) замість повної (~60 КБ):
// для крос-фейду й зуму цього достатньо.
import { animate } from 'motion/mini';

const CYCLE = 4000;      // повний крок: показ + перехід
const FADE = 0.9;        // тривалість крос-фейду, с
const ZOOM_FROM = 1.08;  // стартовий масштаб кадру, який заходить
const EASE = [0.4, 0, 0.2, 1];

export function initHeroSlider() {
  const root = document.querySelector('[data-hero-slider]');
  if (!root) return; // на бойовій головній у героя одна статична картинка

  const slides = [...root.querySelectorAll('.hero-slide')];
  if (slides.length < 2) return;

  // Без анімацій за системним налаштуванням лишаємо перший кадр статичним.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  slides.forEach((slide, i) => { slide.style.opacity = i === 0 ? '1' : '0'; });

  let current = 0;
  let timer = null;

  const show = (next) => {
    const from = slides[current];
    const to = slides[next];
    current = next;

    animate(from, { opacity: 0 }, { duration: FADE, ease: EASE });
    animate(to, { opacity: [0, 1] }, { duration: FADE, ease: EASE });
    // Зум окремою анімацією, розтягнутою на весь цикл: кадр рухається
    // і після завершення переходу, поки просто стоїть на екрані.
    animate(to, { scale: [ZOOM_FROM, 1] }, { duration: CYCLE / 1000 + FADE, ease: 'linear' });
  };

  // Крутимо кадри лише коли герой на екрані й вкладка активна.
  let inView = true;
  const sync = () => {
    const run = inView && !document.hidden;
    if (run && !timer) timer = setInterval(() => show((current + 1) % slides.length), CYCLE);
    if (!run && timer) { clearInterval(timer); timer = null; }
  };

  document.addEventListener('visibilitychange', sync);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }).observe(root);
  } else {
    sync();
  }
}
