/* листва. — общая логика сайта */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const page = document.body.dataset.page;

  const fmt = (n) => new Intl.NumberFormat("ru-RU").format(n).replace(/\s/g, " ");
  const tenge = (n) => `${fmt(n)} ₸`;
  const usd = (n) => `≈ $${fmt(Math.round(n / USD_RATE / 10) * 10)}`;
  const tourById = (id) => TOURS.find((t) => t.id === id);

  const ICON = {
    arrow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12L12 4M5.5 4H12v6.5"/></svg>',
    star: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.2l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12l-4.2 2.2.8-4.7L1.2 6.2l4.7-.7z"/></svg>',
    plus: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 1v10M1 6h10"/></svg>',
    plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10.5 13.5L3 11l1.5-1.5 7.5.5 4.5-4.5a2 2 0 013 3L15 13l.5 7.5L14 22l-2.5-7.5-3 3V20l-1.5 1-1-3.5L2.5 16l1-1.5H6l3-3"/></svg>',
    bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 00-3-3h-7v5M7 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 16h14M5 16v2M19 16v2M4 16v-4l2-5h12l2 5v4M4 12h16"/><circle cx="7.5" cy="14" r=".5"/><circle cx="16.5" cy="14" r=".5"/></svg>',
    guide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 5h11v8H9l-4 3v-3H4zM15 9h5v7h-1v3l-4-3h-4v-3"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    visa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M9 16h6"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/></svg>',
    wine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 3h8l-.5 5a3.5 3.5 0 01-7 0zM12 11.5V20M8.5 21h7"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15M5 19l7-7"/></svg>',
  };
  const stars = (r) => `<div class="rev__stars" aria-label="Оценка ${r} из 5">${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= r ? "" : "off"}">${ICON.star}</span>`).join("")}</div>`;
  const initials = (name) => name.replace(/[^А-ЯЁа-яёA-Za-z ]/g, "").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  /* ---------- Появление при скролле ---------- */
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px" })
    : null;
  function observe() {
    $$(".reveal:not(.is-in)").forEach((el) => io ? io.observe(el) : el.classList.add("is-in"));
    syncPressed();
    enhanceButtons();
  }

  /* Эффект наведения на кнопки: точка разрастается, подпись сменяется на подпись со стрелкой */
  function enhanceButtons() {
    $$(".btn:not([data-fx])").forEach((b) => {
      const label = b.textContent.trim();
      if (!label) return;
      b.dataset.fx = "";
      b.textContent = "";
      const dot = document.createElement("span");
      dot.className = "btn__dot";
      dot.setAttribute("aria-hidden", "true");
      const base = document.createElement("span");
      base.className = "btn__label btn__label--base";
      base.textContent = label;
      const hover = document.createElement("span");
      hover.className = "btn__label btn__label--hover";
      hover.setAttribute("aria-hidden", "true");
      hover.innerHTML = `<span></span><svg class="btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
      hover.firstChild.textContent = label;
      b.append(dot, base, hover);
    });
  }

  /* Состояние кнопок-фильтров для скринридеров */
  function syncPressed() { $$(".pills .pill").forEach((b) => b.setAttribute("aria-pressed", b.classList.contains("is-active"))); }
  document.addEventListener("click", (e) => { if (e.target.closest(".pills .pill")) requestAnimationFrame(syncPressed); });

  /* ---------- Шапка / футер ---------- */
  const NAV = [["tours.html", "Туры"], ["index.html#season", "Сезон"], ["reviews.html", "Отзывы"], ["about.html", "О нас"]];
  const header = $("#header");
  if (header) {
    const solid = header.dataset.solid !== undefined;
    header.className = "header" + (solid ? " header--solid" : "");
    header.innerHTML = `
      <a class="skip" href="#main">Перейти к содержимому</a>
      <div class="wrap header__in">
        <a href="index.html" class="logo" aria-label="листва — на главную">листва<i>.</i></a>
        <nav class="nav" aria-label="Основное меню">${NAV.map(([h, t]) => `<a href="${h}" class="${location.pathname.endsWith(h) ? "is-current" : ""}">${t}</a>`).join("")}</nav>
        <a href="about.html#contact" class="btn btn--sm btn--head">Подобрать тур</a>
        <button class="burger" aria-label="Открыть меню"><span></span></button>
      </div>`;
    const m = document.createElement("div");
    m.className = "mnav";
    m.innerHTML = `
      <div class="mnav__top"><span class="logo">листва<i>.</i></span><button class="mnav__close" aria-label="Закрыть меню">×</button></div>
      <nav>${[["index.html", "Главная"], ...NAV].map(([h, t]) => `<a href="${h}">${t}</a>`).join("")}</nav>
      <a href="about.html#contact" class="btn btn--light">Подобрать тур</a>`;
    document.body.appendChild(m);
    const toggle = (open) => { m.classList.toggle("is-open", open); document.body.style.overflow = open ? "hidden" : ""; };
    $(".burger", header).addEventListener("click", () => toggle(true));
    $(".mnav__close", m).addEventListener("click", () => toggle(false));
    $$("a", m).forEach((a) => a.addEventListener("click", () => toggle(false)));
  }

  const footer = $("#footer");
  if (footer) {
    footer.className = "footer";
    footer.innerHTML = `
      <div class="wrap">
        <div class="footer__top">
          <div>
            <a href="index.html" class="logo">листва<i>.</i></a>
            <p style="margin-top:16px;color:#bdbdbd;max-width:34ch">Авторские осенние туры за рубеж из Алматы и Астаны. Лицензия ГЛ № 0012345 от 14.03.2019.</p>
            <form class="footer__sub" onsubmit="event.preventDefault();this.innerHTML='<span style=&quot;padding:12px 16px&quot;>Спасибо! Подборка уже летит к вам.</span>'">
              <input type="email" required placeholder="E-mail для подборки туров" aria-label="E-mail">
              <button class="btn btn--sm btn--light" type="submit">Подписаться</button>
            </form>
          </div>
          <div><h5>Туры</h5><ul>${TOURS.slice(0, 5).map((t) => `<li><a href="tour.html?id=${t.id}">${t.country}</a></li>`).join("")}<li><a href="tours.html">Все туры →</a></li></ul></div>
          <div><h5>Компания</h5><ul><li><a href="about.html">О нас</a></li><li><a href="reviews.html">Отзывы</a></li><li><a href="about.html#contact">Контакты</a></li><li><a href="about.html#faq">Вопросы</a></li></ul></div>
          <div><h5>Связь</h5><ul><li><a href="tel:+77272900900">+7 727 290 09 00</a></li><li><a href="https://wa.me/77012900900">WhatsApp</a></li><li><a href="#">Instagram</a></li><li><a href="#">Telegram</a></li></ul></div>
        </div>
        <div class="footer__word" aria-hidden="true">листва.</div>
        <div class="footer__bot"><span>© 2026 листва. Сезон «Осень 2026»</span><span>Цены указаны за человека при двухместном размещении</span></div>
      </div>`;
  }

  /* ---------- Карточка тура ---------- */
  const tourCard = (t) => `
    <a href="tour.html?id=${t.id}" class="card reveal">
      <div class="card__media">
        <img src="${t.img.replace("w=1200", "w=800")}" alt="${t.title}" loading="lazy" decoding="async">
        <div class="card__tags">${t.badge ? `<span class="tag tag--glass">${t.badge}</span>` : ""}<span class="tag tag--glass">${t.days} дней</span></div>
      </div>
      <div class="card__body">
        <span class="card__country">${t.country}</span>
        <h3 class="card__title">${t.title}</h3>
        <div class="card__meta"><span>${t.months.map((m) => MONTHS[m]).join(", ")}</span><span>★ ${t.rating.toFixed(1)}</span></div>
        <div class="card__foot">
          <div class="price"><small>от</small><b>${tenge(t.price)}</b><small>${usd(t.price)}</small></div>
          <span class="arrow-btn" aria-hidden="true">${ICON.arrow}</span>
        </div>
      </div>
    </a>`;

  const reviewCard = (r, showTour = true) => {
    const t = tourById(r.tour);
    return `
    <article class="rev reveal">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">${stars(r.rating)}${showTour && t ? `<a class="rev__tour" href="tour.html?id=${t.id}">${t.country}</a>` : ""}</div>
      <p class="rev__text">«${r.text}»</p>
      <div class="rev__who"><span class="ava">${initials(r.name)}</span><div><b>${r.name}</b><small>${r.city} · ${r.month}</small></div></div>
    </article>`;
  };

  /* ---------- Главная ---------- */
  if (page === "home") {
    // Сезон
    const renderSeason = (m) => {
      const s = SEASON[m];
      $("#seasonTitle").textContent = s.title;
      $("#seasonText").textContent = s.text;
      $("#seasonPanel").innerHTML = s.tours.map((id) => {
        const t = tourById(id);
        return `<a class="mcard" href="tour.html?id=${t.id}"><img src="${t.img.replace("w=1200", "w=600")}" alt="${t.country}" loading="lazy"><div style="display:grid;gap:6px"><span class="card__country">${t.country}</span><h4>${t.title}</h4><p>от ${tenge(t.price)} · ${t.days} дн.</p></div></a>`;
      }).join("");
    };
    $$("#seasonTabs .pill").forEach((b) => b.addEventListener("click", () => {
      $$("#seasonTabs .pill").forEach((x) => x.classList.toggle("is-active", x === b));
      renderSeason(b.dataset.m);
    }));
    renderSeason("oct");

    // Популярные туры
    $("#popular").innerHTML = ["japan", "georgia", "turkey", "italy"].map((id) => tourCard(tourById(id))).join("");

    // Сегменты
    const renderSeg = (k) => {
      const s = SEGMENTS[k];
      const list = TOURS.filter((t) => t.types.includes(k)).slice(0, 3);
      $("#segImg").src = s.img;
      $("#segTitle").textContent = s.title;
      $("#segText").textContent = s.text;
      $("#segAll").href = `tours.html?type=${k}`;
      $("#segList").innerHTML = list.map((t) => `
        <a class="seg__item" href="tour.html?id=${t.id}">
          <img src="${t.img.replace("w=1200", "w=200")}" alt="" loading="lazy">
          <div><h4>${t.title}</h4><p>${t.country} · ${t.days} дней · от ${tenge(t.price)}</p></div>
          <span class="arrow-btn" aria-hidden="true">${ICON.arrow}</span>
        </a>`).join("");
    };
    $$("#segTabs .pill").forEach((b) => b.addEventListener("click", () => {
      $$("#segTabs .pill").forEach((x) => x.classList.toggle("is-active", x === b));
      renderSeg(b.dataset.s);
    }));
    renderSeg("couples");

    // Отзывы
    $("#homeReviews").innerHTML = [REVIEWS[0], REVIEWS[3], REVIEWS[1]].map((r) => reviewCard(r)).join("");

    // Параллакс ветки
    const img = $(".hero__img");
    if (img && !matchMedia("(prefers-reduced-motion: reduce)").matches && innerWidth > 720) {
      addEventListener("scroll", () => {
        const y = scrollY;
        if (y < innerHeight) img.style.transform = `translate(-50%, ${y * 0.18}px) rotate(${y * 0.004}deg)`;
      }, { passive: true });
    }
  }

  /* ---------- Каталог ---------- */
  if (page === "tours") {
    const params = new URLSearchParams(location.search);
    const state = { region: "all", type: params.get("type") || "all", month: params.get("month") || "all", max: 1700000, sort: "pop" };
    const pills = (el, dict, key) => {
      el.innerHTML = [["all", "Все"], ...Object.entries(dict)].map(([k, v]) => `<button class="pill pill--white ${state[key] === k ? "is-active" : ""}" data-v="${k}">${v}</button>`).join("");
      el.addEventListener("click", (e) => {
        const b = e.target.closest(".pill"); if (!b) return;
        state[key] = b.dataset.v;
        $$(".pill", el).forEach((x) => x.classList.toggle("is-active", x === b));
        render();
      });
    };
    pills($("#fRegion"), REGIONS, "region");
    pills($("#fType"), TYPES, "type");
    pills($("#fMonth"), MONTHS, "month");
    const range = $("#fBudget"), out = $("#fBudgetOut");
    range.addEventListener("input", () => { state.max = +range.value; render(); });
    $("#fSort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });

    const render = () => {
      out.textContent = "до " + tenge(state.max);
      let list = TOURS.filter((t) =>
        (state.region === "all" || t.region === state.region) &&
        (state.type === "all" || t.types.includes(state.type)) &&
        (state.month === "all" || t.months.includes(state.month)) &&
        t.price <= state.max);
      if (state.sort === "asc") list.sort((a, b) => a.price - b.price);
      if (state.sort === "desc") list.sort((a, b) => b.price - a.price);
      if (state.sort === "days") list.sort((a, b) => a.days - b.days);
      if (state.sort === "pop") list.sort((a, b) => b.rating - a.rating);
      $("#found").textContent = `Найдено туров: ${list.length}`;
      $("#catalog").innerHTML = list.length
        ? list.map(tourCard).join("")
        : "";
      $("#empty").hidden = list.length > 0;
      observe();
    };
    $("#resetFilters").addEventListener("click", () => location.href = "tours.html");
    render();
  }

  /* ---------- Страница тура ---------- */
  if (page === "tour") {
    const t = tourById(new URLSearchParams(location.search).get("id")) || null;
    const root = $("#main");
    if (!t) {
      root.innerHTML = `<div class="empty" style="margin-top:40px"><h2 class="h-2">Тур не найден</h2><p class="muted">Возможно, он уже распродан. Посмотрите другие осенние направления.</p><a class="btn btn--dark" href="tours.html">Все туры</a></div>`;
    } else {
      document.title = `${t.title} — листва.`;
      const packs = [
        ["Базовый", "Отели 3–4★, завтраки, групповые экскурсии", t.price],
        ["Комфорт", "Отели по программе, ужины, лучшие места в группе", Math.round(t.price * 1.25 / 10000) * 10000],
        ["Премиум", "Отели 5★, индивидуальный гид, бизнес-зал", Math.round(t.price * 1.65 / 10000) * 10000],
      ];
      const revs = REVIEWS.filter((r) => r.tour === t.id);
      root.innerHTML = `
        <nav class="crumbs" style="margin:24px 0 16px"><a href="index.html">Главная</a>/<a href="tours.html">Туры</a>/<span>${t.country}</span></nav>
        <section class="thero">
          <img src="${t.gallery[0]}" alt="${t.title}">
          <div class="thero__in">
            <div class="pills">${t.badge ? `<span class="tag tag--glass" style="color:var(--ink)">${t.badge}</span>` : ""}${t.types.map((k) => `<span class="tag tag--glass" style="color:var(--ink)">${TYPES[k]}</span>`).join("")}</div>
            <div class="thero__row">
              <div style="display:grid;gap:14px;max-width:820px">
                <span class="eyebrow" style="color:#fff">${t.country}</span>
                <h1 class="h-1">${t.title}</h1>
                <p style="font-size:17px;opacity:.9;max-width:60ch">${t.short}</p>
              </div>
              <a href="#book" class="btn btn--light">Забронировать</a>
            </div>
          </div>
        </section>
        <div class="facts">
          <div class="fact"><small>Длительность</small><b>${t.days} дней</b></div>
          <div class="fact"><small>Маршрут</small><b>${t.cities}</b></div>
          <div class="fact"><small>Вылеты</small><b>${t.dates[0]}</b></div>
          <div class="fact"><small>Группа</small><b>${t.group}</b></div>
          <div class="fact"><small>Цена от</small><b>${tenge(t.price)}</b></div>
        </div>
        <div class="tlayout" style="margin-top:16px">
          <div>
            <div class="box reveal"><h3 class="h-3">Почему стоит поехать</h3><ul class="hl">${t.highlights.map((h) => `<li>${h}</li>`).join("")}</ul></div>
            <div class="box reveal"><div class="gal">${t.gallery.map((g, i) => `<img src="${g}" alt="${t.country}, фото ${i + 1}" loading="lazy">`).join("")}</div></div>
            <div class="box reveal"><h3 class="h-3">Программа по дням</h3>
              <div id="program">${t.program.map(([title, text], i) => `
                <div class="acc ${i === 0 ? "is-open" : ""}">
                  <button class="acc__btn" aria-expanded="${i === 0}"><span class="acc__day">День ${i + 1}</span><span class="acc__title">${title}</span><span class="acc__ico">${ICON.plus}</span></button>
                  <div class="acc__body"><div><p>${text}</p></div></div>
                </div>`).join("")}</div>
            </div>
            <div class="box reveal"><h3 class="h-3">Что входит в стоимость</h3>
              <div class="inc"><div class="yes"><h4>Включено</h4><ul>${t.included.map((x) => `<li>${x}</li>`).join("")}</ul></div><div class="no"><h4>Оплачивается отдельно</h4><ul>${t.excluded.map((x) => `<li>${x}</li>`).join("")}</ul></div></div>
            </div>
            <div class="box reveal"><h3 class="h-3">Где живём</h3>
              <div class="hotels">${t.hotels.map(([n, c, s]) => `<div class="hotel"><div><b>${n}</b><div class="small muted">${c}</div></div><span>${"★".repeat(s)}</span></div>`).join("")}</div>
            </div>
            ${revs.length ? `<div class="box reveal"><h3 class="h-3">Отзывы путешественников</h3><div style="display:grid;gap:12px">${revs.map((r) => reviewCard(r, false).replace('class="rev reveal"', 'class="rev" style="background:var(--bg)"')).join("")}</div></div>` : ""}
          </div>
          <aside class="aside" id="book">
            <div class="box">
              <h3 class="h-3" style="margin-bottom:18px">Выберите пакет</h3>
              <div class="pack">${packs.map(([n, d, p], i) => `
                <label><input type="radio" name="pack" value="${p}" data-name="${n}" ${i === 1 ? "checked" : ""}><span><b>${n}</b><small>${d}</small></span><span class="p">${tenge(p)}</span></label>`).join("")}</div>
              <div class="field" style="margin-top:16px"><label for="bDate">Дата вылета</label><select id="bDate">${t.dates.map((d) => `<option>${d}</option>`).join("")}</select></div>
              <div class="field" style="margin-top:12px"><label for="bPax">Путешественников</label><select id="bPax">${[1, 2, 3, 4, 5, 6].map((n) => `<option ${n === 2 ? "selected" : ""}>${n}</option>`).join("")}</select></div>
              <div class="total" style="margin-top:18px"><span class="muted small">Итого</span><div style="text-align:right"><b id="bTotal"></b><div class="small muted" id="bUsd"></div></div></div>
            </div>
            <div class="box">
              <h3 class="h-3" style="margin-bottom:18px">Оставить заявку</h3>
              <form class="form" data-form="booking" data-tour="${t.title.replace(/"/g, "&quot;")}" novalidate>
                <div class="hp" aria-hidden="true"><label for="bSite">Не заполняйте это поле</label><input id="bSite" name="website" tabindex="-1" autocomplete="off"></div>
                <div class="field"><label for="bName">Имя</label><input id="bName" name="name" required placeholder="Как к вам обращаться"><span class="err">Введите имя</span></div>
                <div class="field"><label for="bPhone">Телефон</label><input id="bPhone" name="phone" type="tel" required placeholder="+7 (___) ___-__-__"><span class="err">Введите номер телефона</span></div>
                <label class="check"><input type="checkbox" required checked> Согласен на обработку персональных данных</label>
                <button class="btn btn--dark" type="submit">Забронировать место</button>
                <p class="small muted">Предоплата 30% — только после звонка менеджера.</p>
                <p class="form__fail" role="alert" hidden>Не получилось отправить заявку. Попробуйте ещё раз или позвоните: <a href="tel:+77272900900">+7 727 290 09 00</a></p>
                <div class="form__ok" role="status"><b style="font-family:var(--f-head);font-size:20px">Заявка принята!</b><span style="color:#ccc">Менеджер перезвонит в течение часа и закрепит места на «${t.title}».</span></div>
              </form>
            </div>
          </aside>
        </div>
        <section class="section--tight"><div class="sec-head"><div><span class="eyebrow">Похожие туры</span><h2 class="h-2">Ещё немного осени</h2></div><a href="tours.html" class="btn">Все туры</a></div>
        <div class="grid-tours grid-tours--3">${TOURS.filter((x) => x.id !== t.id && x.types.some((k) => t.types.includes(k))).slice(0, 3).map(tourCard).join("")}</div></section>`;

      const calc = () => {
        const p = +$('input[name="pack"]:checked').value, n = +$("#bPax").value;
        $("#bTotal").textContent = tenge(p * n);
        $("#bUsd").textContent = `${usd(p * n)} · ${n} чел.`;
      };
      $$('input[name="pack"]').forEach((r) => r.addEventListener("change", calc));
      $("#bPax").addEventListener("change", calc);
      calc();
    }
  }

  /* ---------- Отзывы ---------- */
  if (page === "reviews") {
    const avg = REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length;
    $("#avg").textContent = avg.toFixed(1).replace(".", ",");
    $("#avgStars").innerHTML = stars(Math.round(avg));
    $("#bars").innerHTML = [5, 4, 3, 2, 1].map((n) => {
      const c = REVIEWS.filter((r) => r.rating === n).length;
      return `<div class="bar"><span>${n} звёзд</span><i style="--w:${(c / REVIEWS.length) * 100}%"></i><span class="muted">${c}</span></div>`;
    }).join("");
    const state = { tour: "all", type: "all" };
    const mk = (el, entries, key) => {
      el.innerHTML = [["all", "Все"], ...entries].map(([k, v]) => `<button class="pill pill--white ${k === "all" ? "is-active" : ""}" data-v="${k}">${v}</button>`).join("");
      el.addEventListener("click", (e) => {
        const b = e.target.closest(".pill"); if (!b) return;
        state[key] = b.dataset.v;
        $$(".pill", el).forEach((x) => x.classList.toggle("is-active", x === b));
        render();
      });
    };
    mk($("#rTour"), TOURS.map((t) => [t.id, t.country]), "tour");
    mk($("#rType"), Object.entries(TYPES), "type");
    const render = () => {
      const list = REVIEWS.filter((r) => (state.tour === "all" || r.tour === state.tour) && (state.type === "all" || r.type === state.type));
      $("#revList").innerHTML = list.map((r) => reviewCard(r)).join("") || `<div class="empty"><p>Пока нет отзывов с такими параметрами.</p></div>`;
      observe();
    };
    render();
  }

  /* ---------- Аккордеон ---------- */
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".acc__btn"); if (!b) return;
    const acc = b.parentElement, open = !acc.classList.contains("is-open");
    acc.classList.toggle("is-open", open);
    b.setAttribute("aria-expanded", open);
  });

  /* ---------- Формы ---------- */
  document.addEventListener("submit", async (e) => {
    const f = e.target.closest("[data-form]");
    if (!f) return;
    e.preventDefault();
    if (f.classList.contains("is-sending")) return;

    let ok = true;
    $$("[required]", f).forEach((i) => {
      const field = i.closest(".field");
      let valid = i.type === "checkbox" ? i.checked : i.value.trim().length > 1;
      if (i.type === "tel") valid = i.value.replace(/\D/g, "").length >= 10;
      if (i.type === "email") valid = /.+@.+\..+/.test(i.value);
      if (field) field.classList.toggle("is-error", !valid);
      if (!valid) ok = false;
    });
    if (!ok) { $(".is-error input, .is-error select", f)?.focus(); return; }

    const fail = $(".form__fail", f);
    if (fail) fail.hidden = true;

    // Демо-режим: адрес Google-скрипта ещё не указан в data.js
    if (!LEADS_ENDPOINT) {
      console.info("LEADS_ENDPOINT не задан — заявка не отправлена (демо-режим).");
      f.classList.add("is-sent");
      return;
    }

    const payload = { ...Object.fromEntries(new FormData(f)), form: f.dataset.form, page: location.pathname + location.search };
    if (f.dataset.form === "booking") {
      const pack = $('input[name="pack"]:checked');
      Object.assign(payload, {
        tour: f.dataset.tour,
        pack: pack?.dataset.name || "",
        departure: $("#bDate")?.value || "",
        pax: $("#bPax")?.value || "",
        total: $("#bTotal")?.textContent || "",
      });
    }

    const btn = $('button[type="submit"]', f);
    const label = btn && $(".btn__label--base", btn);
    const labelText = label?.textContent;
    f.classList.add("is-sending");
    btn?.setAttribute("aria-busy", "true");
    if (btn) btn.disabled = true;
    if (label) label.textContent = "Отправляем…";

    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      // text/plain — чтобы браузер не делал предварительный запрос, который Google-скрипт не понимает
      const res = await fetch(LEADS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || "server");
      f.classList.add("is-sent");
    } catch (err) {
      console.error("Заявка не отправилась:", err);
      if (fail) fail.hidden = false;
    } finally {
      f.classList.remove("is-sending");
      btn?.removeAttribute("aria-busy");
      if (btn) btn.disabled = false;
      if (label) label.textContent = labelText;
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.type === "tel") {
      let d = e.target.value.replace(/\D/g, "");
      if (d.startsWith("8")) d = "7" + d.slice(1);
      if (!d.startsWith("7")) d = "7" + d;
      d = d.slice(0, 11);
      const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
      e.target.value = "+7" + (p[0] ? ` (${p[0]}` : "") + (p[0].length === 3 ? ")" : "") + (p[1] ? ` ${p[1]}` : "") + (p[2] ? `-${p[2]}` : "") + (p[3] ? `-${p[3]}` : "");
    }
    e.target.closest(".field")?.classList.remove("is-error");
  });

  observe();
})();
