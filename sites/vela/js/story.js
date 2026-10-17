/* =========================================================
   Сценарий: что происходит с ноутбуком и камерой в каждой главе.
   Время t измеряется в главах: t = 3 — сцена стоит в позе главы 3,
   t = 3.5 — на полпути к главе 4. Состояние зависит только от t,
   поэтому прокрутка вверх проигрывает всё назад.
   ========================================================= */
(function (V) {
  if (!V) return;
  const THREE = V.THREE;
  const { LID_OPEN } = V;

  // Сколько экранов прокрутки занимает одна глава
  const K = 1.4;

  const BASE = {
    lid: 0, scr: 0,                       // крышка открыта, экран включён
    dsp: 0, kb: 0, ex: 0, bay: 0,         // слои экрана, клавиатура, полный разбор, «отсек» для крупных планов
    fCpu: 0, fCool: 0, fBat: 0, fSnd: 0,  // на какой детали фокус
    az: 0, el: 0.4, dist: 10,             // камера: азимут, высота, расстояние
    tx: 0, ty: 0.1, tz: 0,                // точка, на которую она смотрит
    shift: 1,                             // сдвиг кадра, чтобы освободить место тексту
    tall: 1,                              // во сколько раз отъехать на вертикальном экране
    drop: 0,                              // на какую долю высоты опустить ноутбук в кадре
  };
  const pose = (o) => ({ ...BASE, ...o });
  const open = { lid: 1, scr: 1 };
  const apart = { ...open, kb: 1, ex: 1, dsp: 0.55 };
  const inside = { ...apart, bay: 1 };

  const POSES = [
    pose({ az: 0.62, el: 0.36, dist: 9.2, ty: 0.08, shift: 0, tall: 1.3, drop: 0.17 }),                  // 0 начало
    pose({ ...open, az: -0.42, el: 0.24, dist: 10.8, ty: 0.95, tz: -0.2 }),                              // 1 открытие
    pose({ ...open, dsp: 1, az: 1.16, el: 0.2, dist: 11.6, ty: 1.1, tz: 0.35 }),                         // 2 экран
    pose({ ...open, kb: 1, az: 0.42, el: 0.68, dist: 10.2, ty: 0.8, tz: 0 }),                            // 3 клавиатура
    pose({ ...apart, az: -0.6, el: 0.3, dist: 15.5, ty: 1.25, tz: -0.1 }),                               // 4 разбор
    pose({ ...inside, fCpu: 1, az: 0.38, el: 0.86, dist: 3.5, tx: -0.02, ty: 0.05, tz: -0.54 }),         // 5 процессор
    pose({ ...inside, fCool: 1, az: -0.3, el: 0.72, dist: 6.4, tx: 0.3, ty: 0.25, tz: -0.7 }),           // 6 охлаждение
    pose({ ...inside, fBat: 1, az: 0.3, el: 0.95, dist: 7.2, ty: 0.2, tz: 0.5, tall: 1.3 }),             // 7 батарея
    pose({ ...inside, fSnd: 1, az: 0.72, el: 0.6, dist: 7.4, tx: 0.2, ty: 0.2, tz: 0.4, tall: 1.25 }),   // 8 звук
    pose({ az: -0.5, el: 0.42, dist: 9.6, ty: 0.08, shift: 0, tall: 1.3 }),                              // 9 сборка
  ];

  // Часть перехода между главами, за которую меняется параметр: детали успевают
  // остановиться к тексту, камера плывёт почти всё время
  const PART_WINDOW = [0.1, 0.9];
  const CAMERA_WINDOW = [0.04, 0.96];
  const CAMERA = new Set(['az', 'el', 'dist', 'tx', 'ty', 'tz', 'shift', 'tall', 'drop']);
  // Сборка: сначала детали встают на место, потом закрывается крышка
  const WINDOWS = {
    9: {
      ex: [0.05, 0.55], bay: [0.05, 0.55], kb: [0.18, 0.6], dsp: [0.05, 0.45], fSnd: [0.05, 0.4],
      lid: [0.48, 0.86], scr: [0.48, 0.78],
    },
  };

  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const easeParts = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const easeCamera = (p) => -(Math.cos(Math.PI * p) - 1) / 2;

  function sample(t, S) {
    const last = POSES.length - 1;
    const tt = Math.min(Math.max(t, 0), last);
    const i = Math.min(Math.floor(tt), last - 1);
    const f = tt - i;
    const a = POSES[i], b = POSES[i + 1];
    const custom = WINDOWS[i + 1];
    for (const k in a) {
      const cam = CAMERA.has(k);
      const w = (custom && custom[k]) || (cam ? CAMERA_WINDOW : PART_WINDOW);
      const p = clamp01((f - w[0]) / (w[1] - w[0]));
      S[k] = a[k] + (b[k] - a[k]) * (cam ? easeCamera(p) : easeParts(p));
    }
    return S;
  }

  // Насколько глава i «в кадре» при времени t: 1 рядом с её позой, 0 вдали
  function presence(t, i, inner, outer) {
    const d = Math.abs(t - i);
    if (d <= inner) return 1;
    if (d >= outer) return 0;
    const p = (outer - d) / (outer - inner);
    return p * p * (3 - 2 * p);
  }

  /* ---------- Смещения деталей по вертикали ---------- */
  const EX = { bottom: -0.6, board: -0.2, battery: 0.08, cooling: 0.32, speakers: 0.52, topcase: 0.9, trackpad: 1.12, keyplate: 1.2, keycaps: 1.3 };
  // «Отсек»: верх корпуса уезжает из кадра, внутренности ложатся в одну плоскость, как в открытом ноутбуке
  const BAY = { bottom: -0.16, board: 0, battery: 0, cooling: 0, speakers: 0, topcase: 3.4, trackpad: 3.5, keyplate: 3.5, keycaps: 3.5 };
  const KB = { keyplate: 0.1, keycaps: 0.32 };
  const LIFT = { cooling: (S) => 1.1 * S.fCpu + 0.3 * S.fCool, battery: (S) => 0.3 * S.fBat, speakers: (S) => 0.3 * S.fSnd };
  const FOCUS = { board: 'fCpu', cooling: 'fCool', battery: 'fBat', speakers: 'fSnd' };
  const DIM = new THREE.Color(0x050506);

  function setDim(part, d) {
    if (Math.abs(d - part.userData.dim) < 0.004) return;
    part.userData.dim = d;
    for (const m of part.userData.mats) {
      m.color.copy(m.userData.color0).lerp(DIM, d * 0.55);
      m.envMapIntensity = 1 - 0.7 * d;
    }
  }

  function applyState(model, S, env) {
    const { parts, refs } = model;

    // На вертикальном экране камера дальше и видит больше, поэтому верх корпуса уезжает выше
    const away = env.compact ? 1.8 : 1;
    for (const name in EX) {
      const lift = LIFT[name] ? LIFT[name](S) : 0;
      const bay = BAY[name] > 1 ? BAY[name] * away : BAY[name];
      parts[name].position.y = S.ex * (EX[name] * env.spread * (1 - S.bay) + bay * S.bay) + (KB[name] || 0) * S.kb + lift;
    }

    refs.lid.rotation.x = -S.lid * LID_OPEN;
    parts.glass.position.y = -1.2 * S.dsp;
    parts.panel.position.y = -0.75 * S.dsp;
    parts.backlight.position.y = -0.32 * S.dsp;

    refs.screen.color.setScalar(S.scr);
    refs.leds.color.setScalar(S.scr);
    refs.keyGlow.color.setScalar(S.scr * 0.9);
    refs.legend.color.setScalar(0.5 + 0.5 * S.scr);

    // В крупном плане остаётся яркой одна деталь, остальные темнеют
    const any = Math.min(1, S.fCpu + S.fCool + S.fBat + S.fSnd);
    for (const name in EX) setDim(parts[name], any * (1 - (FOCUS[name] ? S[FOCUS[name]] : 0)));

    for (const bar of refs.bars) bar.scale.x = Math.max(0.001, S.fBat);
  }

  /* ---------- То, что живёт во времени: вентиляторы, воздух, звук, пульс кристалла ---------- */
  const m4 = new THREE.Matrix4();

  function animate(model, S, time, dt, still) {
    const { refs } = model;

    const pulse = still ? 1 : 0.86 + 0.14 * Math.sin(time * 2.2);
    refs.die.emissiveIntensity = S.fCpu * 2.4 * pulse;
    refs.chipGlow.material.opacity = S.fCpu * 0.5 * pulse;

    if (!still) for (const fan of refs.impellers) fan.rotation.y -= dt * 26 * S.fCool;

    refs.air.visible = S.fCool > 0.01;
    if (refs.air.visible) {
      refs.air.material.opacity = S.fCool * 0.55;
      refs.airLanes.forEach((lane, i) => {
        const p = still ? lane.phase : (time * 0.55 + lane.phase) % 1;
        m4.makeScale(1, 1, 0.2 + Math.sin(Math.PI * p)).setPosition(lane.x, 0.045, -0.94 - p);
        refs.air.setMatrixAt(i, m4);
      });
      refs.air.instanceMatrix.needsUpdate = true;
    }

    refs.rings.forEach((ring, i) => {
      ring.visible = S.fSnd > 0.01;
      if (!ring.visible) return;
      const p = still ? (i % 2 ? 0.7 : 0.3) : (time * 0.5 + i * 0.5) % 1;
      ring.scale.setScalar(1 + p * 1.5);
      ring.material.opacity = S.fSnd * (1 - p) * 0.8;
    });
  }

  function placeCamera(camera, S, env) {
    const d = S.dist * env.fit * (env.compact ? S.tall : 1);
    const flat = Math.cos(S.el);
    const ty = S.ty + (env.spread - 1) * 0.5 * S.ex * (1 - S.bay);
    camera.position.set(S.tx + d * flat * Math.sin(S.az), ty + d * Math.sin(S.el), S.tz + d * flat * Math.cos(S.az));
    camera.lookAt(S.tx, ty, S.tz);
    // На широком экране текст слева, ноутбук сдвинут вправо; на узком текст снизу, ноутбук выше
    const ox = env.compact ? 0 : -env.side * env.W * S.shift;
    const oy = (env.compact ? 0.12 * env.H * S.shift : 0) - S.drop * env.H;
    camera.setViewOffset(env.W, env.H, ox, oy, env.W, env.H);
    camera.updateMatrixWorld();
  }

  V.story = { K, POSES, sample, presence, applyState, animate, placeCamera };
})(window.Vela);
