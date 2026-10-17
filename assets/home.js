/* =========================================================
   Главная: сцена с тремя работами и «сайт в разборе».
   На большом экране обе секции закреплены и проигрываются прокруткой,
   на телефоне и при отключённой анимации остаются обычной страницей.
   ========================================================= */
(function () {
  const stage = document.querySelector('.stage');
  const layers = document.querySelector('.layers');
  const { gsap, ScrollTrigger, Site } = window;
  if (!stage) return;

  // Окна въезжают, когда первый скриншот готов (но не дольше полутора секунд)
  const first = stage.querySelector('.win__page');
  const go = () => stage.classList.add('is-ready');
  Promise.race([
    first && first.decode ? first.decode().catch(() => {}) : Promise.resolve(),
    new Promise((r) => setTimeout(r, 1500)),
  ]).then(go);

  if (!gsap || !ScrollTrigger) return;

  const works = [...stage.querySelectorAll('.work')];
  const wins = works.map((w) => w.querySelector('.win'));
  const views = works.map((w) => w.querySelector('.win__view'));
  const pages = works.map((w) => w.querySelector('.win__page'));
  const copies = works.map((w) => [...w.querySelector('.work__copy').children]);
  const frames = [...stage.querySelectorAll('.win__frames img')];
  const intro = stage.querySelector('.intro');
  const title = stage.querySelector('.intro__title');
  const railBtns = [...stage.querySelectorAll('.rail button')];
  const palette = works.map((w) => {
    const cs = getComputedStyle(w);
    return { bg: cs.getPropertyValue('--bg').trim(), fg: cs.getPropertyValue('--fg').trim() };
  });

  const BIG = '(min-width: 960px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)';
  const mm = gsap.matchMedia();

  /* ---------- Большой экран: закреплённая сцена ---------- */
  mm.add(BIG, () => {
    stage.classList.add('is-pinned');
    stage.setAttribute('data-nav-clear', '');
    stage.dataset.tone = 'dark';

    const tilt = { rotationY: -24, rotationX: 10, rotationZ: 2.5, scale: 0.9, autoAlpha: 1 };
    const INTRO = [
      { ...tilt, xPercent: -4, yPercent: 20, z: 0, '--dim': 0 },
      { ...tilt, xPercent: 17, yPercent: -5, z: -260, '--dim': 0.12 },
      { ...tilt, xPercent: 38, yPercent: -30, z: -520, '--dim': 0.26 },
    ];
    const FRONT = { xPercent: 0, yPercent: 0, z: 0, scale: 1, rotationX: 0, rotationY: 0, rotationZ: 0, '--dim': 0 };
    const BACK1 = { ...FRONT, yPercent: -8, scale: 0.93, '--dim': 0.4 };
    const BACK2 = { ...FRONT, yPercent: -15.5, scale: 0.86, '--dim': 0.62 };
    const GONE = { yPercent: -135, rotationZ: -7, rotationX: 16, autoAlpha: 0 };

    wins.forEach((w, i) => gsap.set(w, INTRO[i]));
    gsap.set(frames.slice(1), { opacity: 0 });

    // Сколько страницы прокрутить внутри окна: почти до подвала
    const travel = (i) => () => -(pages[i].offsetHeight - views[i].offsetHeight) * 0.94;
    const T = { l0: 1.0, l1: 3.6, h0: 4.6, h1: 7.2, v0: 8.2, v1: 11.2, end: 11.6 };

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: stage, start: 'top top', end: '+=760%', pin: true, scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    // Вступление уходит, колода разворачивается к зрителю
    tl.to(title, { yPercent: -30, duration: 0.9, ease: 'power1.in' }, 0)
      .to(intro, { autoAlpha: 0, duration: 0.6, ease: 'power1.in' }, 0.1)
      .to(wins[0], { ...FRONT, duration: 1.2 }, 0)
      .to(wins[1], { ...BACK1, duration: 1.2 }, 0)
      .to(wins[2], { ...BACK2, duration: 1.2 }, 0)
      .to(stage, { backgroundColor: palette[0].bg, color: palette[0].fg, duration: 0.7 }, 0.3)
      .fromTo(copies[0], { y: 44, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.07, duration: 0.5, ease: 'power2.out' }, 0.65)
      .to(pages[0], { y: travel(0), duration: T.l1 - T.l0, ease: 'none' }, T.l0);

    // Смена работы: верхнее окно улетает, следующее выходит вперёд
    function swap(from, at) {
      const to = from + 1;
      tl.to(copies[from], { y: -36, autoAlpha: 0, stagger: 0.04, duration: 0.35, ease: 'power2.in' }, at - 0.1)
        .to(wins[from], { ...GONE, duration: 0.8, ease: 'power2.in' }, at)
        .to(wins[to], { ...FRONT, duration: 0.9 }, at + 0.15)
        .to(stage, { backgroundColor: palette[to].bg, color: palette[to].fg, duration: 0.6 }, at + 0.2)
        .fromTo(copies[to], { y: 44, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.07, duration: 0.5, ease: 'power2.out' }, at + 0.55);
      if (wins[to + 1]) tl.to(wins[to + 1], { ...BACK1, duration: 0.9 }, at + 0.15);
    }
    swap(0, T.l1);
    tl.to(pages[1], { y: travel(1), duration: T.h1 - T.h0, ease: 'none' }, T.h0);
    swap(1, T.h1);

    // Vela: вместо длинной страницы — кадры разбора ноутбука
    const step = (T.v1 - T.v0) / (frames.length - 1);
    frames.slice(1).forEach((f, i) => tl.to(f, { opacity: 1, duration: step * 0.16, ease: 'none' }, T.v0 + step * (i + 0.6)));
    tl.to({}, { duration: 0.01 }, T.end);
    // Сглаженная прокрутка догоняет позицию с опозданием, поэтому следим за самой шкалой
    tl.eventCallback('onUpdate', sync);

    const SEG = [[0.55, T.l1 + 0.3], [T.l1 + 0.3, T.h1 + 0.3], [T.h1 + 0.3, T.end]];
    const JUMP = [1.25, T.h0 + 0.1, T.v0 + 0.1];
    function sync() {
      const t = tl.time();
      const now = t < SEG[0][0] ? -1 : t < SEG[1][0] ? 0 : t < SEG[2][0] ? 1 : 2;
      railBtns.forEach((b, i) => {
        const p = Math.min(1, Math.max(0, (t - SEG[i][0]) / (SEG[i][1] - SEG[i][0])));
        b.style.setProperty('--p', p.toFixed(3));
        b.setAttribute('aria-current', String(i === now));
      });
      const tone = now === 0 ? 'light' : 'dark';
      if (stage.dataset.tone !== tone) { stage.dataset.tone = tone; Site.refreshTone(); }
    }

    const onRail = (e) => {
      const i = railBtns.indexOf(e.currentTarget);
      const st = tl.scrollTrigger;
      Site.scrollTo(st.start + (st.end - st.start) * (JUMP[i] / tl.duration()), 1.6);
    };
    railBtns.forEach((b) => b.addEventListener('click', onRail));

    // Лёгкий параллакс колоды: сдвигаем точку перспективы за указателем
    let mx = 0, my = 0, cx = 0, cy = 0;
    const onMove = (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
    window.addEventListener('pointermove', onMove, { passive: true });
    const tick = () => {
      cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06;
      stage.style.setProperty('--mx', cx.toFixed(4));
      stage.style.setProperty('--my', cy.toFixed(4));
    };
    gsap.ticker.add(tick);

    Site.refreshTone();
    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.ticker.remove(tick);
      railBtns.forEach((b) => b.removeEventListener('click', onRail));
      stage.classList.remove('is-pinned');
      stage.removeAttribute('data-nav-clear');
      delete stage.dataset.tone;
      gsap.set([stage, intro, title, ...wins, ...pages, ...frames, ...copies.flat()], { clearProps: 'all' });
      Site.refreshTone();
    };
  });

  /* ---------- Телефон: окна листаются, пока проезжают по экрану ---------- */
  mm.add('(max-width: 959px) and (prefers-reduced-motion: no-preference), (max-height: 619px) and (prefers-reduced-motion: no-preference)', () => {
    pages.forEach((p, i) => {
      if (!p) return;
      gsap.to(p, {
        y: () => -(p.offsetHeight - views[i].offsetHeight) * 0.45, ease: 'none',
        scrollTrigger: { trigger: wins[i], start: 'top 85%', end: 'bottom 10%', scrub: 0.4, invalidateOnRefresh: true },
      });
    });
    if (frames.length) {
      gsap.set(frames.slice(1), { opacity: 0 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: frames[0].closest('.win'), start: 'top 75%', end: 'bottom 15%', scrub: 0.4 } });
      frames.slice(1).forEach((f) => tl.to(f, { opacity: 1, duration: 0.5, ease: 'none' }, '>0.4'));
    }
    return () => gsap.set([...pages.filter(Boolean), ...frames], { clearProps: 'all' });
  });

  /* ---------- Сайт в разборе ---------- */
  if (!layers) return;
  const stack = layers.querySelector('.stack');
  const items = [...layers.querySelectorAll('.layers__list li')];

  mm.add(BIG, () => {
    layers.classList.add('is-pinned');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: layers, start: 'top top', end: '+=340%', pin: true, scrub: 0.5 },
    });
    tl.fromTo(stack, { '--ex': 0 }, { '--ex': 1, duration: 1, ease: 'power2.inOut' })
      .to({}, { duration: items.length * 0.62 });
    tl.eventCallback('onUpdate', mark);

    function mark() {
      const t = tl.time();
      const i = t < 0.8 ? -1 : Math.min(items.length - 1, Math.floor((t - 0.8) / 0.62));
      items.forEach((li, k) => li.classList.toggle('is-on', k === i));
      if (i < 0) delete stack.dataset.active;
      else stack.dataset.active = items[i].dataset.layer;
    }
    return () => {
      layers.classList.remove('is-pinned');
      items.forEach((li) => li.classList.remove('is-on'));
      delete stack.dataset.active;
      gsap.set(stack, { clearProps: 'all' });
    };
  });
})();
