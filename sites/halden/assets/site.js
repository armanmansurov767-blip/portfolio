/* =========================================================
   Halden — общий скрипт: шапка, выпадающее меню, мобильное меню,
   подвал, листалка между страницами и форма заявки
   ========================================================= */
(function () {
  var CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/';
  var IMG = {
    hero:     CDN + 'hf_20260928_144652_9eaf1d6a-3e8d-4460-bd5b-0ec7221685a0.png',
    glacier:  CDN + 'hf_20260928_051509_384c49d8-b37c-49a7-9180-a06ad914ec24.png',
    volcano:  CDN + 'hf_20260928_051509_bf51abc3-090e-459f-8066-8f0cdd0c36b9.png',
    dunes:    CDN + 'hf_20260928_051509_c4fa86ad-842a-41c9-8cff-a70068ac1aa3.png',
    islands:  CDN + 'hf_20260928_051511_ab19ff38-a140-442d-b2e7-82e3431bf3b6.png',
    group:    CDN + 'hf_20260928_051510_400ed870-8ffb-4030-b267-2b003780a5e3.png',
    solo:     CDN + 'hf_20260928_051510_3d88d3aa-ac8a-4e80-b70b-0da5523138cf.png'
  };
  window.HALDEN_IMG = IMG;

  // Адрес Google-скрипта для приёма заявок: строка в таблице «Halden — заявки с сайта»
  // и письмо на mansurovarman32@gmail.com. Пусто — демо-режим без отправки.
  // Код скрипта — google-apps-script/Code.gs
  var LEADS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx7OebX_l1ZKosbMDhhak8Nk1_UoH2YWL0quwYwfamUv6NKbm8-Z2O0KfdOSEJBS54_/exec';

  var NAV = {
    discover: [
      { slug: 'glaciers',  title: 'Ледники', desc: 'Древние ледяные поля в голубых трещинах.', img: IMG.glacier },
      { slug: 'volcanoes', title: 'Вулканы', desc: 'Пройдите по краю, где земля ещё рождается.', img: IMG.volcano },
      { slug: 'dunes',     title: 'Дюны',    desc: 'Песчаные моря, созданные ветром и тенями.', img: IMG.dunes },
      { slug: 'islands',   title: 'Острова', desc: 'Далёкие берега, где ритм задаёт океан.', img: IMG.islands }
    ],
    journeys: [
      { slug: 'small-groups', title: 'Походы в малых группах', desc: 'Шесть путешественников, один гид, никакой толпы.', img: IMG.group },
      { slug: 'solo',         title: 'Индивидуальные экспедиции', desc: 'Продуманы от начала до конца под ваш темп.', img: IMG.solo }
    ],
    regions: [
      { slug: 'nordics',   title: 'Скандинавия', img: IMG.hero },
      { slug: 'patagonia', title: 'Патагония',   img: IMG.glacier },
      { slug: 'himalaya',  title: 'Гималаи',     img: IMG.group },
      { slug: 'oceania',   title: 'Океания',     img: IMG.islands }
    ]
  };
  var SECTION_NAME = { discover: 'Открытия', journeys: 'Путешествия', regions: 'Регионы' };
  var ORDER = ['discover', 'journeys', 'regions'];
  var ALL = NAV.discover.concat(NAV.journeys, NAV.regions);

  var body = document.body;
  var page = body.dataset.page || '';
  var section = body.dataset.section || '';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function cur(slug) { return slug === page ? ' aria-current="page"' : ''; }

  var CHEVRON = '<svg viewBox="0 0 8 5" aria-hidden="true"><path d="M1 1l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var LOGO = '<svg viewBox="0 0 30 26" aria-hidden="true"><path fill="#fff" fill-rule="evenodd" d="M3.2 19.6C.4 15.8 1.3 8.6 6.6 4.7 11.3 1.2 18.9.9 23.9 4.1c4.7 3 6.3 9 3.6 13.9-2.9 5.3-9.4 7.7-15.4 7-3.8-.4-6.9-2.4-8.9-5.4ZM9.5 17.2l4.3-6.4 2.6 3.6 1.7-2.2 3.4 5z"/></svg>';
  var ARROW = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M1 7h12M8 2l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  window.HALDEN_ARROW = ARROW;

  /* ---------- Шапка ---------- */
  var header = document.getElementById('header');
  if (header) {
    var discoverRows = NAV.discover.map(function (d, i) {
      return '<a class="d-item' + (i === 0 ? ' is-active' : '') + '" data-img="' + i + '" href="' + d.slug + '.html"' + cur(d.slug) + '>' +
        '<strong>' + d.title + '</strong><span>' + d.desc + '</span></a>';
    }).join('');
    var discoverImgs = NAV.discover.map(function (d, i) {
      return '<img' + (i === 0 ? ' class="is-active"' : '') + ' alt="" src="' + d.img + '">';
    }).join('');
    var journeyCards = NAV.journeys.map(function (d) {
      return '<a class="card" href="' + d.slug + '.html"' + cur(d.slug) + '><img alt="" src="' + d.img + '">' +
        '<strong>' + d.title + '</strong><span>' + d.desc + '</span></a>';
    }).join('');
    var regionLinks = NAV.regions.map(function (d) {
      return '<a class="r-link" href="' + d.slug + '.html"' + cur(d.slug) + '>' + d.title + '</a>';
    }).join('');
    var triggerHtml = ORDER.map(function (id) {
      return '<li><button class="trigger' + (section === id ? ' is-current' : '') + '" data-menu="' + id + '" aria-expanded="false" aria-controls="p-' + id + '">' +
        SECTION_NAME[id] + CHEVRON + '</button></li>';
    }).join('');
    var sheetHtml = ORDER.map(function (id) {
      return '<h3>' + SECTION_NAME[id] + '</h3>' + NAV[id].map(function (d) {
        return '<a href="' + d.slug + '.html"' + cur(d.slug) + '>' + d.title + '</a>';
      }).join('');
    }).join('') + '<h3>Halden</h3><a href="index.html"' + cur('home') + '>Главная</a><a href="story.html"' + cur('story') + '>О нас</a><a href="contact.html"' + cur('contact') + '>Оставить заявку</a>';

    header.innerHTML =
      '<div class="bar">' +
        '<a class="logo" href="index.html" aria-label="Halden — на главную">' + LOGO + '</a>' +
        '<nav class="desktop-nav" id="nav" aria-label="Основное меню">' +
          '<ul class="links">' + triggerHtml +
            '<li><a class="plain-link" id="story-link" href="story.html"' + cur('story') + '>О нас</a></li>' +
          '</ul>' +
          '<div class="dd" id="dd">' +
            '<div class="panel" id="p-discover" data-panel="discover">' +
              '<div class="d-list">' + discoverRows + '</div>' +
              '<div class="d-media" aria-hidden="true">' + discoverImgs + '</div>' +
            '</div>' +
            '<div class="panel" id="p-journeys" data-panel="journeys">' + journeyCards + '</div>' +
            '<div class="panel" id="p-regions" data-panel="regions">' + regionLinks + '</div>' +
          '</div>' +
        '</nav>' +
        '<div class="actions">' +
          '<a class="cta" href="contact.html"' + cur('contact') + '>Оставить заявку</a>' +
          '<button class="menu-btn" id="menu-btn" aria-label="Открыть меню" aria-expanded="false" aria-controls="sheet">' +
            '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 5.5h12M2 10.5h12" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div class="sheet" id="sheet">' + sheetHtml + '</div>';

    initDropdown();
    initSheet();
  }

  /* ---------- Выпадающее меню с морфингом ---------- */
  function initDropdown() {
    var PAD = 20; // 8px отступ панели + 12px отступ строки
    var nav = document.getElementById('nav');
    var dd = document.getElementById('dd');
    var storyLink = document.getElementById('story-link');

    var triggers = {};
    var panels = {};
    ORDER.forEach(function (id) {
      triggers[id] = nav.querySelector('.trigger[data-menu="' + id + '"]');
      panels[id] = dd.querySelector('[data-panel="' + id + '"]');
    });
    var allPanels = ORDER.map(function (id) { return panels[id]; });

    var current = null;
    var closeTimer = null;
    var openedByHover = null;

    function place(id) {
      var panel = panels[id];
      var pw = panel.offsetWidth;
      var ph = panel.offsetHeight;
      var tr = triggers[id].getBoundingClientRect();
      var hr = header.getBoundingClientRect();
      var x = tr.left - PAD;
      x = Math.max(hr.left + 12, Math.min(x, hr.right - pw - 12));
      x -= (dd.offsetParent || header).getBoundingClientRect().left;
      dd.style.setProperty('--x', x + 'px');
      dd.style.setProperty('--w', pw + 'px');
      dd.style.setProperty('--h', ph + 'px');
    }

    function open(id) {
      clearTimeout(closeTimer);
      if (id === current) return;
      var panel = panels[id];

      if (!current) {
        dd.classList.add('instant', 'snap');
        allPanels.forEach(function (p) {
          p.classList.add('snap');
          p.removeAttribute('data-state');
        });
        place(id);
        void dd.offsetWidth;
        dd.classList.remove('snap');
        allPanels.forEach(function (p) { p.classList.remove('snap'); });
        dd.classList.add('open');
        requestAnimationFrame(function () { dd.classList.remove('instant'); });
      } else {
        var dir = ORDER.indexOf(id) > ORDER.indexOf(current) ? 1 : -1;
        panels[current].dataset.state = dir > 0 ? 'exit-left' : 'exit-right';
        panel.classList.add('snap');
        panel.dataset.state = dir > 0 ? 'exit-right' : 'exit-left';
        void panel.offsetWidth;
        panel.classList.remove('snap');
        place(id);
      }

      panel.dataset.state = 'active';
      ORDER.forEach(function (key) {
        triggers[key].setAttribute('aria-expanded', key === id ? 'true' : 'false');
      });
      current = id;
    }

    function close() {
      clearTimeout(closeTimer);
      if (!current) return;
      dd.classList.remove('open');
      panels[current].removeAttribute('data-state');
      ORDER.forEach(function (key) { triggers[key].setAttribute('aria-expanded', 'false'); });
      current = null;
    }

    function scheduleClose(ms) {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(close, ms === undefined ? 140 : ms);
    }

    ORDER.forEach(function (id) {
      var t = triggers[id];
      t.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        open(id);
        openedByHover = id;
      });
      t.addEventListener('click', function () {
        // Клик мышью сразу после открытия наведением не должен захлопывать меню
        if (current === id && openedByHover === id) { openedByHover = null; return; }
        openedByHover = null;
        if (current === id) close(); else open(id);
      });
    });

    storyLink.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'mouse') scheduleClose(60);
    });

    nav.addEventListener('pointerenter', function () { clearTimeout(closeTimer); });
    nav.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse') scheduleClose();
    });
    nav.addEventListener('focusout', function (e) {
      if (!nav.contains(e.relatedTarget)) scheduleClose(0);
    });

    document.addEventListener('pointerdown', function (e) {
      if (current && !nav.contains(e.target)) close();
    });

    window.addEventListener('resize', function () {
      if (current) place(current);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !current) return;
      var t = triggers[current];
      close();
      t.focus();
    });

    // «Открытия»: наведение на строку меняет картинку справа
    var dItems = dd.querySelectorAll('.d-item');
    var dImgs = dd.querySelectorAll('.d-media img');
    function activate(item) {
      var idx = +item.dataset.img;
      dItems.forEach(function (el) { el.classList.toggle('is-active', el === item); });
      dImgs.forEach(function (img, i) { img.classList.toggle('is-active', i === idx); });
    }
    dItems.forEach(function (item) {
      item.addEventListener('pointerenter', function () { activate(item); });
      item.addEventListener('focus', function () { activate(item); });
    });
  }

  /* ---------- Мобильное меню ---------- */
  function initSheet() {
    var menuBtn = document.getElementById('menu-btn');
    var sheet = document.getElementById('sheet');
    function setSheet(isOpen) {
      sheet.classList.toggle('open', isOpen);
      menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    }
    menuBtn.addEventListener('click', function () {
      setSheet(!sheet.classList.contains('open'));
    });
    sheet.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setSheet(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet.classList.contains('open')) {
        setSheet(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- Блок «Оставить заявку» внизу страниц маршрутов ---------- */
  var ctaSlot = document.querySelector('[data-cta]');
  if (ctaSlot) {
    var item = ALL.filter(function (d) { return d.slug === page; })[0];
    var title = ctaSlot.dataset.title || (item ? 'Хотите поехать — ' + item.title.toLowerCase() + '?' : 'Готовы к своей экспедиции?');
    ctaSlot.innerHTML =
      '<div class="cta-band reveal">' +
        '<img src="' + (ctaSlot.dataset.img || (item ? item.img : IMG.hero)) + '" alt="" loading="lazy">' +
        '<div><h2>' + esc(title) + '</h2>' +
        '<p>Оставьте заявку — куратор свяжется с вами в течение суток, подберёт даты и ответит на все вопросы.</p></div>' +
        '<a class="btn" href="contact.html' + (item ? '?trip=' + item.slug : '') + '">Оставить заявку' + ARROW + '</a>' +
      '</div>';
  }

  /* ---------- Листалка «предыдущий / следующий» ---------- */
  var pager = document.querySelector('[data-pager]');
  if (pager) {
    var i = ALL.map(function (d) { return d.slug; }).indexOf(page);
    if (i > -1) {
      var prev = ALL[(i - 1 + ALL.length) % ALL.length];
      var next = ALL[(i + 1) % ALL.length];
      pager.innerHTML =
        '<a href="' + prev.slug + '.html"><small>← Предыдущее</small><strong>' + prev.title + '</strong></a>' +
        '<a class="next" href="' + next.slug + '.html"><small>Следующее →</small><strong>' + next.title + '</strong></a>';
    }
  }

  /* ---------- Подвал ---------- */
  var footer = document.getElementById('footer');
  if (footer) {
    var cols = ORDER.map(function (id) {
      return '<div><h4>' + SECTION_NAME[id] + '</h4><ul>' + NAV[id].map(function (d) {
        return '<li><a href="' + d.slug + '.html">' + d.title + '</a></li>';
      }).join('') + '</ul></div>';
    }).join('');
    footer.innerHTML =
      '<div class="container">' +
        '<div class="footer-grid">' +
          '<div><a class="brand" href="index.html">' + LOGO + 'Halden</a>' +
          '<p class="about">Экспедиции на край света для тех, кто хочет увидеть Землю такой, какой она была до дорог и толп.</p></div>' +
          cols +
          '<div><h4>Halden</h4><ul><li><a href="story.html">О нас</a></li><li><a href="contact.html">Оставить заявку</a></li>' +
          '<li><a href="tel:+78005553535">+7 800 555-35-35</a></li><li><a href="mailto:hello@halden.travel">hello@halden.travel</a></li></ul></div>' +
        '</div>' +
        '<div class="wordmark" aria-hidden="true">Halden</div>' +
        '<div class="footer-bottom"><span>© 2026 Halden. Экспедиционные путешествия.</span><span>Сделано для тех, кто идёт дальше</span></div>' +
      '</div>';
  }

  /* ---------- Появление блоков при прокрутке ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Форма заявки ---------- */
  var form = document.getElementById('lead-form');
  if (form) initForm(form);

  function initForm(form) {
    var wrap = form.closest('.form-wrap');
    var select = form.querySelector('#f-trip');

    // Варианты направлений берём из меню, чтобы списки не расходились
    ORDER.forEach(function (id) {
      var group = document.createElement('optgroup');
      group.label = SECTION_NAME[id];
      NAV[id].forEach(function (d) {
        var o = document.createElement('option');
        o.value = d.slug;
        o.textContent = d.title;
        group.appendChild(o);
      });
      select.appendChild(group);
    });
    var other = document.createElement('option');
    other.value = 'other';
    other.textContent = 'Пока не знаю — нужна консультация';
    select.appendChild(other);

    var trip = new URLSearchParams(location.search).get('trip');
    if (trip && select.querySelector('option[value="' + trip + '"]')) select.value = trip;

    form.addEventListener('input', function (e) {
      var t = e.target;
      if (t.type === 'tel') {
        var d = t.value.replace(/\D/g, '');
        if (!d) { t.value = ''; return; }
        if (d.charAt(0) === '8') d = '7' + d.slice(1);
        if (d.charAt(0) !== '7') d = '7' + d;
        d = d.slice(0, 11);
        var p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
        t.value = '+7' + (p[0] ? ' (' + p[0] : '') + (p[0].length === 3 ? ')' : '') + (p[1] ? ' ' + p[1] : '') + (p[2] ? '-' + p[2] : '') + (p[3] ? '-' + p[3] : '');
      }
      var f = t.closest('.field');
      if (f) f.classList.remove('is-error');
    });
    form.addEventListener('change', function (e) {
      var f = e.target.closest('.field');
      if (f) f.classList.remove('is-error');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (wrap.classList.contains('is-sending')) return;

      var ok = true;
      form.querySelectorAll('[required]').forEach(function (inp) {
        var valid = inp.type === 'checkbox' ? inp.checked : inp.value.trim().length > 1;
        if (inp.type === 'tel') valid = inp.value.replace(/\D/g, '').length >= 11;
        if (inp.type === 'email') valid = /.+@.+\..+/.test(inp.value);
        var field = inp.closest('.field');
        if (field) field.classList.toggle('is-error', !valid);
        if (!valid) ok = false;
      });
      var email = form.querySelector('#f-email');
      if (email.value.trim() && !/.+@.+\..+/.test(email.value)) {
        email.closest('.field').classList.add('is-error');
        ok = false;
      }
      if (!ok) {
        var bad = form.querySelector('.is-error input, .is-error select');
        if (bad) bad.focus();
        return;
      }
      if (form.querySelector('[name="website"]').value) return; // ловушка для ботов

      var data = Object.fromEntries(new FormData(form));
      var opt = select.options[select.selectedIndex];
      data.tripTitle = opt ? opt.textContent : '';
      data.page = location.pathname + location.search;

      var btn = form.querySelector('button[type="submit"]');
      var label = btn.querySelector('.label');
      var fail = form.querySelector('.form-fail');
      fail.hidden = true;
      wrap.classList.add('is-sending');
      btn.disabled = true;
      label.textContent = 'Отправляем…';

      send(data).then(function () {
        showSuccess(data);
      }).catch(function (err) {
        console.error('Заявка не отправилась:', err);
        fail.hidden = false;
      }).then(function () {
        wrap.classList.remove('is-sending');
        btn.disabled = false;
        label.textContent = 'Отправить заявку';
      });
    });

    function send(data) {
      if (!LEADS_ENDPOINT) {
        console.info('LEADS_ENDPOINT не задан — заявка показана как отправленная (демо-режим).', data);
        return new Promise(function (r) { setTimeout(r, 900); });
      }
      var ctrl = new AbortController();
      var timer = setTimeout(function () { ctrl.abort(); }, 15000);
      // text/plain — чтобы браузер не делал предварительный запрос, который Google-скрипт не понимает
      return fetch(LEADS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
        signal: ctrl.signal
      }).then(function (res) {
        clearTimeout(timer);
        return res.json();
      }).then(function (out) {
        if (!out.ok) throw new Error(out.error || 'server');
      });
    }

    function showSuccess(data) {
      var num = 'H-' + String(Date.now()).slice(-6);
      var first = data.name.trim().split(/\s+/)[0];
      wrap.querySelector('[data-s="name"]').textContent = first;
      wrap.querySelector('[data-s="num"]').textContent = num;
      wrap.querySelector('[data-s="trip"]').textContent = data.tripTitle;
      wrap.querySelector('[data-s="format"]').textContent = data.format;
      wrap.querySelector('[data-s="when"]').textContent = data.when || 'Обсудим с куратором';
      wrap.querySelector('[data-s="phone"]').textContent = data.phone;
      wrap.classList.add('is-sent');
      var top = wrap.getBoundingClientRect().top + window.scrollY - 40;
      window.scrollTo({ top: top });
      wrap.querySelector('.success h2').focus({ preventScroll: true });
    }
  }
})();
