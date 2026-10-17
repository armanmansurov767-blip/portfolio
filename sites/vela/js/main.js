/* =========================================================
   Vela 14 — запуск: сцена, привязка к прокрутке, запасные режимы.
   Если WebGL или библиотеки недоступны, страница остаётся обычным текстом.
   ========================================================= */
(function (V) {
  if (!V) return;
  const { createScene, buildLaptop, createOverlay } = V;
  const { K, POSES, sample, applyState, animate, placeCamera } = V.story;

  const html = document.documentElement;
  const story = document.getElementById('story');
  const stage = document.getElementById('stage');
  const canvas = document.getElementById('scene');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function start() {
    const { gsap, ScrollTrigger, Lenis } = window;
    if (!gsap || !ScrollTrigger) return;

    let view;
    try {
      view = createScene(canvas);
    } catch (err) {
      console.warn('3D-сцена недоступна, показываем статичную версию:', err);
      return;
    }
    const { renderer, scene, camera } = view;
    const model = buildLaptop();
    scene.add(model.root);

    // С этого момента страница «живая»: холст закреплён, тексты лежат поверх него
    html.classList.add('live');
    story.style.setProperty('--n', POSES.length);
    story.style.setProperty('--k', K);

    const overlay = createOverlay({ stage, camera, anchors: model.anchors });
    const S = {};
    const env = { W: 1, H: 1, compact: false, fit: 1, side: 0.16, spread: 1 };
    let pending = 4; // сколько кадров дорисовать, даже если прокрутка стоит

    function resize() {
      const W = stage.clientWidth, H = stage.clientHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      env.W = W;
      env.H = H;
      env.compact = W < 900 || W / H <= 1.1;
      // Чем у́же экран, тем дальше камера: на вертикальном ноутбук должен влезть по ширине,
      // на горизонтальном — оставить место тексту слева
      env.fit = env.compact ? Math.max(1, 0.66 / camera.aspect) : Math.pow(Math.max(1, 1.7 / camera.aspect), 0.7);
      // Доля ширины, на которую ноутбук сдвинут вправо от центра: на узком экране меньше, чтобы подписи влезли
      env.side = Math.min(0.16, Math.max(0.1, 0.16 - (1.7 - camera.aspect) * 0.11));
      env.spread = Math.min(1.7, Math.max(1, 1 + (H / W - 1) * 0.5));    // на вертикальном экране слои расходятся шире
      overlay.measure();
      pending = 3;
    }
    new ResizeObserver(resize).observe(stage);
    resize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);

    /* ---------- Прокрутка ---------- */
    gsap.registerPlugin(ScrollTrigger);
    const clock = { t: 0 };
    gsap.to(clock, {
      t: POSES.length - 1,
      ease: 'none',
      scrollTrigger: { trigger: story, start: 'top top', end: 'bottom bottom', scrub: still ? true : 0.5 },
    });

    let lenis = null;
    if (!still && Lenis) {
      lenis = new Lenis({ lerp: 0.11 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    function scrollTo(y) {
      if (lenis) lenis.scrollTo(y, { duration: 1.6 });
      else window.scrollTo({ top: y, behavior: still ? 'auto' : 'smooth' });
    }

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href').slice(1);
      const storyTop = story.getBoundingClientRect().top + window.scrollY;
      let y = null;
      if (id === 'top') y = 0;
      else if (/^ch-\d+$/.test(id)) {
        const step = (story.offsetHeight - stage.offsetHeight) / (POSES.length - 1);
        y = storyTop + step * Number(id.slice(3));
      } else {
        const target = document.getElementById(id);
        if (target) y = target.getBoundingClientRect().top + window.scrollY;
      }
      if (y === null) return;
      e.preventDefault();
      scrollTo(y);
    });

    /* ---------- Кадр ---------- */
    let visible = true;
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }).observe(stage);

    let lastT = -1, lastTime = performance.now(), ready = false;
    gsap.ticker.add(() => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (!visible) return;

      const t = clock.t;
      sample(t, S);
      const moving = Math.abs(t - lastT) > 1e-5;
      const alive = !still && (S.fCpu > 0.002 || S.fCool > 0.002 || S.fSnd > 0.002);
      if (!moving && !alive && pending <= 0) return;
      pending--;
      lastT = t;

      applyState(model, S, env);
      animate(model, S, now / 1000, dt, still);
      placeCamera(camera, S, env);
      overlay.update(t, env);
      stage.style.setProperty('--scrim', S.shift.toFixed(3));
      renderer.render(scene, camera);

      if (!ready) { ready = true; canvas.classList.add('is-ready'); }
    });
  }

  start();
})(window.Vela);
