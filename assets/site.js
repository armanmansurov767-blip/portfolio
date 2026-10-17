/* =========================================================
   Портфолио — общее для всех страниц:
   шапка, мобильное меню, подвал, плавная прокрутка, цвет шапки под секцию.
   ========================================================= */
(function () {
  const html = document.documentElement;
  const body = document.body;
  const C = window.PORTFOLIO || {};
  const page = body.dataset.page || '';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const WORKS = [
    { id: 'listva', name: 'листва.', href: 'listva.html' },
    { id: 'halden', name: 'Halden', href: 'halden.html' },
    { id: 'vela', name: 'Vela 14', href: 'vela.html' },
  ];
  const DARK = { cobalt: 1, halden: 1, vela: 1 };

  /* ---------- Шапка, меню, подвал ---------- */
  const worksLinks = WORKS.map((w) =>
    `<a href="${w.href}"${w.id === page ? ' aria-current="page"' : ''}>${w.name}</a>`).join('');

  body.insertAdjacentHTML('afterbegin',
    '<a class="skip" href="#main">Перейти к содержимому</a>' +
    '<header class="nav">' +
      `<a class="nav__name" href="index.html">${C.name || ''}</a>` +
      `<nav class="nav__works" aria-label="Работы">${worksLinks}</nav>` +
      '<a class="nav__cta" href="contact.html">Обсудить сайт</a>' +
      '<button class="nav__burger" type="button" aria-expanded="false" aria-controls="menu">Меню</button>' +
    '</header>' +
    `<div class="menu" id="menu"><a href="index.html">Главная</a>${worksLinks}` +
      '<a class="menu__cta link" href="contact.html">Обсудить сайт</a></div>');

  const foot = document.getElementById('footer');
  if (foot) {
    foot.innerHTML =
      '<div class="wrap foot__in">' +
        `<span>${C.name || ''}, ${new Date().getFullYear()}</span>` +
        `<nav class="foot__links" aria-label="Подвал">${WORKS.map((w) => `<a class="link" href="${w.href}">${w.name}</a>`).join('')}` +
          '<a class="link" href="contact.html">Обсудить сайт</a>' +
          (C.whatsapp ? `<a class="link" href="https://wa.me/${C.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>` : '') +
          (C.telegram ? `<a class="link" href="https://t.me/${C.telegram}" target="_blank" rel="noopener">Telegram</a>` : '') +
          (C.email ? `<a class="link" href="mailto:${C.email}">${C.email}</a>` : '') +
        '</nav>' +
        '<p class="foot__note">Листва, Halden и Vela 14 — концепты: компании, цены и отзывы в них вымышлены. Сами сайты настоящие, их можно открыть и полистать.</p>' +
      '</div>';
  }

  /* ---------- Отзывы: блок появляется, только когда в assets/reviews.js есть записи ---------- */
  const reviews = document.getElementById('reviews');
  const list = window.REVIEWS || [];
  if (reviews && list.length) {
    const box = reviews.querySelector('.quotes');
    list.forEach((r) => {
      const item = document.createElement('li');
      const quote = document.createElement('blockquote');
      quote.textContent = r.text;
      const by = document.createElement('p');
      by.className = 'quotes__by';
      const name = document.createElement('strong');
      name.textContent = r.name;
      by.append(name, [r.role, r.date].filter(Boolean).map((s) => ', ' + s).join(''));
      item.append(quote, by);
      if (r.link) {
        const a = document.createElement('a');
        a.className = 'link';
        a.href = r.link;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = r.link.replace(/^https?:\/\//, '').replace(/\/$/, '');
        item.append(a);
      }
      box.append(item);
    });
    reviews.hidden = false;
  }

  const burger = document.querySelector('.nav__burger');
  const menu = document.getElementById('menu');
  function setMenu(open) {
    html.toggleAttribute('data-menu', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.textContent = open ? 'Закрыть' : 'Меню';
  }
  burger.addEventListener('click', () => setMenu(!html.hasAttribute('data-menu')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Плавная прокрутка ---------- */
  const { gsap, ScrollTrigger, Lenis } = window;
  let lenis = null;
  if (gsap && ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (!still && Lenis) {
      lenis = new Lenis({ lerp: 0.1 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }
  function scrollTo(y, duration) {
    if (lenis) lenis.scrollTo(y, { duration: duration || 1.4 });
    else window.scrollTo({ top: y, behavior: still ? 'auto' : 'smooth' });
  }

  /* ---------- Цвет шапки под текущую секцию ---------- */
  const themed = () => document.querySelectorAll('[data-theme]');
  let lastY = window.scrollY;
  function refreshTone() {
    const probe = 36;
    let found = null;
    themed().forEach((el) => {
      if (found && found.dataset.tone) return; // секция сама управляет тоном (закреплённая сцена)
      const r = el.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) found = el;
    });
    if (found) html.dataset.tone = found.dataset.tone || (DARK[found.dataset.theme] ? 'dark' : 'light');
    const clear = window.scrollY < 8 || (found && found.hasAttribute('data-nav-clear'));
    html.dataset.nav = clear ? 'clear' : 'solid';
    const y = window.scrollY;
    if (clear || y < lastY - 4) html.removeAttribute('data-nav-hidden');
    else if (y > lastY + 4 && y > 400) html.setAttribute('data-nav-hidden', '');
    lastY = y;
  }
  let queued = false;
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; refreshTone(); });
  }, { passive: true });
  window.addEventListener('resize', refreshTone);
  refreshTone();

  /* ---------- Кружок-подсказка над окнами работ ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !still) {
    const dot = document.createElement('div');
    dot.className = 'cursor';
    dot.setAttribute('aria-hidden', 'true');
    body.appendChild(dot);
    let x = 0, y = 0, tx = 0, ty = 0, on = false;
    document.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      const target = e.target.closest && e.target.closest('[data-cursor]');
      if (target) dot.textContent = target.dataset.cursor;
      if (!!target !== on) { on = !!target; dot.classList.toggle('is-on', on); if (on) { x = tx; y = ty; } }
    }, { passive: true });
    (function loop() {
      x += (tx - x) * 0.2; y += (ty - y) * 0.2;
      dot.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Старт: заголовки выезжают, когда шрифты готовы ---------- */
  const ready = () => body.classList.add('is-ready');
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(ready);
  } else ready();

  window.Site = { lenis, scrollTo, refreshTone, still };
})();
