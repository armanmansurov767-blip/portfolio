/* =========================================================
   Страница работы: живой сайт внутри окна.
   Сайт включается по нажатию и встаёт на паузу, когда указатель уходит с окна, —
   иначе прокрутка страницы застревала бы внутри него.
   ========================================================= */
(function () {
  const win = document.querySelector('.demo__win');
  if (!win) return;
  const view = win.querySelector('.demo__view');
  const shield = win.querySelector('.demo__shield');
  const label = shield.querySelector('span');
  const poster = win.querySelector('.demo__poster');
  const hint = document.querySelector('.demo__hint');
  const tabs = [...document.querySelectorAll('.seg button')];
  const t = (window.I18N && window.I18N.t) || ((x) => x);
  const SIZE = { desktop: [1440, 900], phone: [390, 760] };
  let frame = null;

  function fit() {
    if (!frame) return;
    const [w, h] = SIZE[win.dataset.device];
    frame.style.width = w + 'px';
    frame.style.height = h + 'px';
    frame.style.transform = `scale(${view.clientWidth / w})`;
  }
  new ResizeObserver(fit).observe(view);

  function play() {
    if (!frame) {
      frame = document.createElement('iframe');
      frame.src = (window.I18N && window.I18N.withLang) ? window.I18N.withLang(win.dataset.src) : win.dataset.src; // на языке портфолио
      frame.title = win.dataset.title;
      view.insertBefore(frame, shield);
      fit();
    }
    win.dataset.state = 'live';
    if (hint) hint.textContent = t('Сайт включён: листайте и нажимайте прямо в окне. Уведите указатель, чтобы листать страницу дальше.');
  }
  function pause() {
    if (win.dataset.state !== 'live') return;
    win.dataset.state = 'paused';
    label.textContent = t('Продолжить');
    if (hint) hint.textContent = t('Сайт на паузе. Нажмите на окно, чтобы продолжить.');
  }

  shield.addEventListener('click', play);
  win.addEventListener('mouseleave', pause);
  document.addEventListener('pointerdown', (e) => { if (!win.contains(e.target)) pause(); });

  tabs.forEach((b) => b.addEventListener('click', () => {
    win.dataset.device = b.dataset.device;
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t === b)));
    poster.src = b.dataset.poster;
    fit();
  }));

  // На узком экране «компьютерная» версия была бы нечитаемо мелкой — сразу показываем телефонную
  if (view.clientWidth < 560) tabs.find((b) => b.dataset.device === 'phone').click();
})();
