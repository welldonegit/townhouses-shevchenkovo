// Оверлеи: модалка будинку (варіанти + зум плану), лід-модалка, лайтбокс ремонту.
// Общий scroll-lock и стек Escape. Слушатели навешиваются один раз в initModal().
import { HOUSES, PLANS, LEAD } from './data.js';

let houseModal, leadModal, lightbox;
let planImg, planwrap, varswitch, mArea, mVal, featsList, roomsBox;
let leadImg, leadH, leadSub, leadCta, leadForm, houseForm;

// состояние модалки будинку
let activeHouse = null;
let rawVariant = 0;
let zoomed = false;

const show = (el) => { if (el) el.style.display = 'flex'; };
const hide = (el) => { if (el) el.style.display = 'none'; };
const isShown = (el) => !!el && el.style.display !== 'none';

export function updateScrollLock() {
  const menuOpen = !!document.querySelector('.mm.open');
  const locked = isShown(houseModal) || isShown(leadModal) || menuOpen;
  document.body.style.overflow = locked ? 'hidden' : '';
}

function closeMenuDom() {
  document.querySelector('.navbtn')?.classList.remove('open');
  document.querySelector('.mm')?.classList.remove('open');
  document.querySelector('.mm-scrim')?.classList.remove('open');
}

// ── Модалка будинку ─────────────────────────────────────────────────────
export function openHouse(i) {
  activeHouse = i;
  rawVariant = 0;
  zoomed = false;
  closeMenuDom();
  renderHouse();
  show(houseModal);
  updateScrollLock();
}

function renderHouse() {
  const h = HOUSES[activeHouse];
  const plans = PLANS[activeHouse];
  const vCount = h.variants.length;
  const variant = Math.min(rawVariant, vCount - 1);
  const planIdx = Math.min(rawVariant, plans.length - 1);
  const av = h.variants[variant];

  planImg.src = plans[planIdx];
  planwrap.classList.toggle('zoomed', zoomed);

  mArea.replaceChildren(document.createTextNode('ТАУНХАУС ' + h.area), unit('м²'));
  mVal.textContent = h.sections;

  featsList.replaceChildren(...h.features.map((f) => {
    const li = document.createElement('li');
    li.textContent = f;
    return li;
  }));

  // Блок «Площі приміщень» скрыт (display:none) в исходнике — наполняем для полноты.
  roomsBox.replaceChildren(...av.rooms.map((r) => {
    const span = document.createElement('span'); span.className = 'room';
    const rn = document.createElement('span'); rn.className = 'rn'; rn.textContent = r.n;
    const ra = document.createElement('span'); ra.className = 'ra';
    ra.append(document.createTextNode(r.a), unit('м²', 'ru'));
    span.append(rn, ra);
    return span;
  }));

  const hasVariants = plans.length > 1;
  varswitch.style.display = hasVariants ? '' : 'none';
  const btns = varswitch.querySelectorAll('.varbtn');
  btns[0] && btns[0].classList.toggle('on', planIdx === 0);
  btns[1] && btns[1].classList.toggle('on', planIdx === 1);
}

function unit(text, cls) {
  const s = document.createElement('span');
  if (cls) s.className = cls;
  s.textContent = text;
  return s;
}

function setVar(n) {
  rawVariant = n;
  zoomed = false;
  renderHouse();
}

function toggleZoom() {
  zoomed = !zoomed;
  planwrap.classList.toggle('zoomed', zoomed);
}
function closeZoom() {
  zoomed = false;
  planwrap.classList.remove('zoomed');
}
function closeHouse() {
  activeHouse = null;
  zoomed = false;
  planwrap.classList.remove('zoomed');
  hide(houseModal);
  updateScrollLock();
}

// ── Лід-модалка ─────────────────────────────────────────────────────────
export function openLead(type) {
  const cfg = LEAD[type] || LEAD.price;
  closeMenuDom();
  leadImg.src = cfg.img;
  leadH.textContent = cfg.h;
  leadSub.textContent = cfg.sub;
  leadSub.style.display = cfg.sub ? '' : 'none';
  leadCta.textContent = cfg.cta;
  leadCta.setAttribute('data-text', cfg.cta);
  leadForm.dataset.leadType = type;
  show(leadModal);
  updateScrollLock();
}
function closeLead() {
  hide(leadModal);
  updateScrollLock();
}

// ── Лайтбокс ремонту ────────────────────────────────────────────────────
export function openLightbox(src) {
  const img = lightbox.querySelector('img');
  if (img) img.src = src;
  show(lightbox);
}
function closeLightbox() { hide(lightbox); }

// ── Escape-стек (как в исходнике: зум → лід → будинок; лайтбокс закрывается кликом) ──
export function handleEscape() {
  if (zoomed) { closeZoom(); return true; }
  if (isShown(leadModal)) { closeLead(); return true; }
  if (isShown(houseModal)) { closeHouse(); return true; }
  return false;
}

export function initModal() {
  houseModal = document.getElementById('house-modal');
  leadModal = document.getElementById('lead-modal');
  lightbox = document.getElementById('remont-lightbox');
  if (!houseModal || !leadModal || !lightbox) return;

  planImg = houseModal.querySelector('.planimg');
  planwrap = houseModal.querySelector('.planwrap');
  varswitch = houseModal.querySelector('.varswitch');
  mArea = houseModal.querySelector('.marea');
  mVal = houseModal.querySelector('.mval');
  featsList = houseModal.querySelector('.feats-dynamic');
  roomsBox = houseModal.querySelector('.rooms');
  houseForm = houseModal.querySelector('.mform');
  houseForm && (houseForm.dataset.leadType = 'house');

  leadImg = leadModal.querySelector('.lmedia img');
  leadH = leadModal.querySelector('.lform-h');
  leadSub = leadModal.querySelector('.lform-sub');
  leadCta = leadModal.querySelector('.lsubmit .roll-in');
  leadForm = leadModal.querySelector('.lform');

  // Триггеры открытия лид-модалки (кнопки с data-lead).
  document.querySelectorAll('[data-lead]').forEach((el) =>
    el.addEventListener('click', (e) => { e.preventDefault(); openLead(el.getAttribute('data-lead')); }));

  // Закрытие модалки будинку.
  houseModal.addEventListener('click', (e) => { if (e.target === houseModal) closeHouse(); });
  houseModal.querySelector('[data-close-house]').addEventListener('click', closeHouse);
  planwrap.addEventListener('click', toggleZoom);
  houseModal.querySelector('[data-close-zoom]').addEventListener('click', (e) => { e.stopPropagation(); closeZoom(); });
  houseModal.querySelector('[data-toggle-zoom]').addEventListener('click', (e) => { e.stopPropagation(); toggleZoom(); });
  varswitch.querySelectorAll('.varbtn').forEach((b) =>
    b.addEventListener('click', (e) => { e.stopPropagation(); setVar(Number(b.getAttribute('data-var'))); }));

  // Закрытие лид-модалки.
  leadModal.addEventListener('click', (e) => { if (e.target === leadModal) closeLead(); });
  leadModal.querySelector('[data-close-lead]').addEventListener('click', closeLead);

  // Закрытие лайтбокса (клик по фону или кнопке).
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.closest('[data-close-lb]')) closeLightbox();
  });
}
