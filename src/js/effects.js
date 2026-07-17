// Скролл-эффекты и мелкая анимация (перенос из DC-логики без изменений поведения):
// ротация слов hero, заливка заголовка terms, reveal-появления, FAB, прелоадер.
import { HERO_WORDS } from './data.js';

export function initEffects() {
  heroWords();
  termsFill();
  reveal();
  fab();
  preloader();
}

function heroWords() {
  const rot = document.querySelector('.hero-h1 .rot');
  if (!rot) return;
  let i = 0;
  setInterval(() => {
    i = (i + 1) % HERO_WORDS.length;
    const span = document.createElement('span');
    span.className = 'rotword';
    span.textContent = HERO_WORDS[i];
    rot.replaceChildren(span);
  }, 2800);
}

function termsFill() {
  const h = document.querySelector('.terms-h');
  if (!h) return;
  const words = Array.prototype.slice.call(h.querySelectorAll('.tw'));
  if (!words.length) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    words.forEach((w) => { w.style.backgroundPosition = '0 0'; });
    return;
  }
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = h.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const start = vh * 0.82, end = vh * 0.34;
    const prog = clamp((start - r.top) / (start - end));
    const n = words.length;
    for (let i = 0; i < n; i++) {
      const local = clamp(prog * n - i);
      words[i].style.backgroundPosition = (100 - local * 100) + '% 0';
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

function reveal() {
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const noIO = !('IntersectionObserver' in window);
  const secs = ['.adv', '.tech', '.comms'].map((s) => document.querySelector(s)).filter(Boolean);
  secs.forEach((sec) => {
    const els = Array.prototype.slice.call(sec.querySelectorAll('.reveal'));
    if (!els.length) return;
    if (reduced || noIO) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const sorted = els.slice().sort((a, b) => {
          const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
          const rowA = Math.round(ra.top / 30), rowB = Math.round(rb.top / 30);
          return (rowA - rowB) || (ra.left - rb.left);
        });
        sorted.forEach((e, i) => { e.style.transitionDelay = (i * 70) + 'ms'; e.classList.add('in'); });
        obs.disconnect();
      });
    }, { threshold: 0.12 });
    io.observe(sec);
  });
}

function fab() {
  const fabEl = document.querySelector('.re-fab');
  if (!fabEl) return;
  let ticking = false, cur = false;
  const update = () => {
    ticking = false;
    const sec = document.getElementById('remont');
    if (!sec) { if (cur) { cur = false; fabEl.classList.remove('on'); } return; }
    const vh = window.innerHeight;
    const r = sec.getBoundingClientRect();
    let show = r.top < vh * 0.75 && r.bottom > vh * 0.3;
    if (show) {
      const band = vh - 112;
      const clash = (el) => {
        if (!el) return false;
        const b = el.getBoundingClientRect();
        if (!b.width && !b.height) return false;
        return b.bottom > band && b.top < vh - 6;
      };
      if (clash(sec.querySelector('.rl-more a')) || clash(sec.querySelector('.rl-foot .pill'))) show = false;
    }
    if (show !== cur) { cur = show; fabEl.classList.toggle('on', show); }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

function preloader() {
  setTimeout(() => {
    const p = document.getElementById('preload');
    if (!p) return;
    p.classList.add('hide');
    setTimeout(() => { if (p) p.style.display = 'none'; }, 600);
  }, 2000);
}
