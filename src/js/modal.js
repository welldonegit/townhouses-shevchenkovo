// Оверлеи: модалка будинку (варіанти + зум плану), лід-модалка, лайтбокс ремонту.
// Общий scroll-lock и стек Escape. Слушатели навешиваются один раз в initModal().
import { HOUSES, PLANS, DUPLEXES, DUPLEX_PLANS, LEAD } from './data.js';

// Модалка обслуживает две коллекции с одинаковой формой записей (см. data.js).
// Отличаются только подписи: тип дома и заголовок над номером секции.
const COLLECTIONS = {
  houses: { list: HOUSES, plans: PLANS, label: 'ТАУНХАУС', alt: 'Планування таунхауса', secLabel: 'Це планування доступне у будинках' },
  duplex: { list: DUPLEXES, plans: DUPLEX_PLANS, label: 'ДУПЛЕКС', alt: 'Планування дуплекса', secLabel: 'Секція на генплані' },
};

let houseModal, leadModal, lightbox;
let planImg, planwrap, varswitch, mArea, mVal, mLabel, mSold, mPrice, mPriceVal, featsList, roomsBox;
let leadImg, leadH, leadSub, leadCta, leadForm, houseForm;

// состояние модалки будинку
let activeHouse = null;
let activeCollection = 'houses';
let activeSold = false;
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
// opts.sold — картка/секція, з якої відкрили модалку, продана (плашка «Продано»).
export function openHouse(i, collection = 'houses', opts = {}) {
  activeCollection = COLLECTIONS[collection] ? collection : 'houses';
  activeHouse = i;
  activeSold = !!opts.sold;
  rawVariant = 0;
  zoomed = false;
  closeMenuDom();
  renderHouse();
  show(houseModal);
  updateScrollLock();
}

function renderHouse() {
  const c = COLLECTIONS[activeCollection];
  const h = c.list[activeHouse];
  const plans = c.plans[activeHouse];
  const vCount = h.variants.length;
  const variant = Math.min(rawVariant, vCount - 1);
  const planIdx = Math.min(rawVariant, plans.length - 1);
  const av = h.variants[variant];

  planImg.src = plans[planIdx];
  planImg.alt = c.alt;
  planwrap.classList.toggle('zoomed', zoomed);

  mArea.replaceChildren(document.createTextNode(c.label + ' ' + h.area), unit('м²'));
  if (mLabel) mLabel.textContent = c.secLabel;
  mVal.textContent = h.sections;
  if (mSold) mSold.style.display = activeSold ? '' : 'none';
  // Ціна поки задана лише для дуплексів — для решти блок прихований.
  if (mPrice) {
    if (mPriceVal) mPriceVal.textContent = h.price || '';
    mPrice.style.display = h.price ? '' : 'none';
  }

  // Какой именно дом смотрит пользователь — уходит в заявку (form.js читает dataset).
  // Для проданной секции форму запроса цены прячем (разметка остаётся в DOM).
  if (houseForm) {
    houseForm.dataset.house = c.label + ' ' + h.area + 'м²';
    houseForm.style.display = activeSold ? 'none' : '';
  }

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

// ── Лайтбокс ремонту (галерея: стрелки, свайп, клавиши ←/→) ───────────────
let lbItems = [];
let lbIndex = 0;
let lbImg = null;
let lbCount = null;

export function openLightbox(items, index = 0) {
  lbItems = Array.isArray(items) ? items : [items];
  lbIndex = Math.max(0, Math.min(index, lbItems.length - 1));
  lbRender();
  show(lightbox);
}
function lbRender() {
  const it = lbItems[lbIndex];
  const src = typeof it === 'string' ? it : (it && it.src);
  if (lbImg && src) lbImg.src = src;
  const many = lbItems.length > 1;
  if (lbCount) {
    lbCount.style.display = many ? '' : 'none';
    lbCount.textContent = (lbIndex + 1) + ' / ' + lbItems.length;
  }
  lightbox.querySelectorAll('.rl-lb-nav').forEach((b) => { b.style.display = many ? '' : 'none'; });
}
function lbStep(dir) {
  if (lbItems.length < 2) return;
  lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
  lbRender();
}
function closeLightbox() { hide(lightbox); }

// ── Escape-стек (как в исходнике: зум → лід → будинок; лайтбокс закрывается кликом) ──
export function handleEscape() {
  if (isShown(lightbox)) { closeLightbox(); return true; }
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
  mLabel = houseModal.querySelector('.msec .mlabel');
  mSold = houseModal.querySelector('[data-m-sold]');
  mPrice = houseModal.querySelector('[data-m-price]');
  mPriceVal = houseModal.querySelector('[data-m-price-val]');
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

  // Лайтбокс: навигация (стрелки/свайп/клавиши) и закрытие (фон или кнопка).
  lbImg = lightbox.querySelector('img');
  lbCount = lightbox.querySelector('.rl-lb-count');

  lightbox.addEventListener('click', (e) => {
    if (e.target.closest('[data-lb-prev]')) { lbStep(-1); return; }
    if (e.target.closest('[data-lb-next]')) { lbStep(1); return; }
    if (e.target === lightbox || e.target.closest('[data-close-lb]')) closeLightbox();
  });

  let touchX = null;
  lightbox.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 40) lbStep(dx < 0 ? 1 : -1);
  });

  document.addEventListener('keydown', (e) => {
    if (!isShown(lightbox)) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); lbStep(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); lbStep(1); }
  });
}
