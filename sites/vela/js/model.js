/* =========================================================
   Vela 14 — модель ноутбука, собранная из деталей кодом.
   Единица длины — 10 см: корпус 312 × 221 мм, основание 10,5 мм, крышка 4,8 мм.
   Оси: X вправо, Y вверх, Z к зрителю (петля сзади, на −Z).
   ========================================================= */
(function (V) {
  if (!V) return;
  const THREE = V.THREE;
  const { RoundedBoxGeometry, mergeGeometries, toCreasedNormals, tex } = V;

  const W = 3.12, D = 2.21, R = 0.14;
  const LID_D = 2.19;
  const LID_OPEN = 1.885;           // 108°

  // Клавиатура: шаг клавиши и ряды в «юнитах» ширины; строка — блок стрелок
  const PITCH = 0.1876, KEY_GAP = 0.022;
  const KB_W = 14.5 * PITCH, KB_D = 5.5 * PITCH, KB_Z0 = -0.96, KB_CZ = KB_Z0 + KB_D / 2;
  const ROWS = [
    { h: 0.5, keys: Array(14).fill(14.5 / 14) },
    { h: 1, keys: [...Array(13).fill(1), 1.5] },
    { h: 1, keys: [1.5, ...Array(13).fill(1)] },
    { h: 1, keys: [1.75, ...Array(11).fill(1), 1.75] },
    { h: 1, keys: [2.25, ...Array(10).fill(1), 2.25] },
    { h: 1, keys: [1, 1, 1, 1.25, 5, 1.25, 1, '<', '^v', '>'] },
  ];
  const LEGENDS = [
    ['esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', ''],
    ['§', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'delete'],
    ['tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
    ['caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'return'],
    ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'shift'],
    ['fn', 'control', 'option', 'command', '', 'command', 'option'],
  ];
  const CYR = {
    Q: 'Й', W: 'Ц', E: 'У', R: 'К', T: 'Е', Y: 'Н', U: 'Г', I: 'Ш', O: 'Щ', P: 'З', '[': 'Х', ']': 'Ъ',
    A: 'Ф', S: 'Ы', D: 'В', F: 'А', G: 'П', H: 'Р', J: 'О', K: 'Л', L: 'Д', ';': 'Ж', "'": 'Э',
    Z: 'Я', X: 'Ч', C: 'С', V: 'М', B: 'И', N: 'Т', M: 'Ь', ',': 'Б', '.': 'Ю',
  };

  function keyLayout() {
    const keys = [];
    let z = KB_Z0;
    ROWS.forEach((row, r) => {
      const depth = row.h * PITCH;
      let x = -KB_W / 2;
      row.keys.forEach((u, i) => {
        if (typeof u === 'string') {
          // Стрелки в половину высоты; «вверх» и «вниз» делят одно место
          const half = depth / 2;
          for (const ch of u) {
            keys.push({ x: x + PITCH / 2, z: z + (ch === '^' ? half / 2 : half * 1.5), w: PITCH - KEY_GAP, d: half - KEY_GAP, label: ch });
          }
          x += PITCH;
          return;
        }
        const label = LEGENDS[r][i] || '';
        keys.push({ x: x + u * PITCH / 2, z: z + depth / 2, w: u * PITCH - KEY_GAP, d: depth - KEY_GAP, label, sub: CYR[label] });
        x += u * PITCH;
      });
      z += depth;
    });
    return keys;
  }

  /* ---------- Геометрия ---------- */

  function roundedRect(ctx, w, d, r, cx = 0, cy = 0) {
    const x = cx - w / 2, y = cy - d / 2;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    ctx.lineTo(x + w, y + d - r);
    ctx.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2, false);
    ctx.lineTo(x + r, y + d);
    ctx.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI, false);
    ctx.lineTo(x, y + r);
    ctx.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
    return ctx;
  }

  // Плоская деталь со скруглёнными в плане углами. holes — вырезы [ширина, глубина, радиус, x, z]
  function plate(w, d, h, r, holes = []) {
    const b = Math.min(0.004, h * 0.3);
    const shape = roundedRect(new THREE.Shape(), w - 2 * b, d - 2 * b, Math.max(r - b, 0.002));
    for (const [hw, hd, hr, cx, cz] of holes) {
      shape.holes.push(roundedRect(new THREE.Path(), hw + 2 * b, hd + 2 * b, hr, cx, -cz));
    }
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 14,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -(h - 2 * b) / 2, 0);
    // Угол меньше наклона фаски: иначе плоский верх «заваливается» к кромке и на нём появляются ложные блики
    return toCreasedNormals(g, 0.3);
  }

  function rbox(w, h, d, r) {
    return new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2 - 0.0005));
  }

  const faceUp = (w, d) => new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2);
  const faceDown = (w, d) => new THREE.PlaneGeometry(w, d).rotateX(Math.PI / 2);

  function mesh(geometry, material, x = 0, y = 0, z = 0, shadow = true) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = shadow;
    return m;
  }

  /* ---------- Материалы: у каждой детали свои, чтобы приглушать её отдельно ---------- */

  const std = (o) => new THREE.MeshStandardMaterial(o);
  const grain = tex.grainTexture();
  const mat = {
    // Пескоструйный анодированный алюминий: матовый, с мелким зерном в бликах
    alu: () => std({ color: 0xd3d6da, metalness: 1, roughness: 0.46, roughnessMap: grain }),
    aluSoft: () => std({ color: 0xc4c8cd, metalness: 0.85, roughness: 0.3 }),
    fin: () => std({ color: 0x9ea4ab, metalness: 1, roughness: 0.42 }),
    plastic: () => std({ color: 0x101114, metalness: 0.05, roughness: 0.58 }),
    key: () => std({ color: 0x121316, metalness: 0, roughness: 0.44 }),
    copper: () => std({ color: 0xc87a45, metalness: 1, roughness: 0.3 }),
    chip: () => std({ color: 0x0d0e11, metalness: 0.25, roughness: 0.36 }),
    shield: () => std({ color: 0xb9bdc3, metalness: 1, roughness: 0.34 }),
    cell: () => std({ color: 0x17191d, metalness: 0.3, roughness: 0.36 }),
    silver: () => std({ color: 0xd9dde2, metalness: 1, roughness: 0.2 }),
    black: () => std({ color: 0x040405, metalness: 0.3, roughness: 0.3 }),
    decal: (map) => std({ map, transparent: true, depthWrite: false, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 }),
    glow: (map) => new THREE.MeshBasicMaterial({ map, color: 0x000000, toneMapped: false }),
  };

  function buildLaptop() {
    const root = new THREE.Group();
    const parts = {};
    const anchors = {};
    const refs = { impellers: [], rings: [], bars: [], airLanes: [] };
    const rand = tex.rng(42);

    const part = (name, parent) => {
      const g = new THREE.Group();
      g.name = name;
      parent.add(g);
      parts[name] = g;
      return g;
    };
    const anchor = (name, parent, x, y, z) => {
      const o = new THREE.Object3D();
      o.position.set(x, y, z);
      parent.add(o);
      anchors[name] = o;
    };

    /* ===== Нижняя крышка ===== */
    const bottom = part('bottom', root);
    bottom.add(mesh(plate(W, D, 0.012, R), mat.alu(), 0, 0.006, 0));
    bottom.add(mesh(plate(W - 0.08, D - 0.08, 0.002, R - 0.04), mat.plastic(), 0, 0.013, 0));
    const foot = new THREE.CylinderGeometry(0.05, 0.05, 0.008, 20);
    const footMat = mat.plastic();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bottom.add(mesh(foot, footMat, sx * 1.3, -0.004, sz * 0.86));
    anchor('bottom', bottom, 1.56, 0.006, 0.55);

    /* ===== Плата ===== */
    const board = part('board', root);
    board.add(mesh(plate(1.9, 0.92, 0.012, 0.03), std({ color: 0x0a0b0d, metalness: 0.2, roughness: 0.5 }), 0, 0.026, -0.56));
    board.add(mesh(faceUp(1.86, 0.88), std({ map: tex.pcbTexture(), metalness: 0.35, roughness: 0.48 }), 0, 0.0325, -0.56));

    // Чип V1: на одной подложке кристалл процессора и два модуля памяти, вокруг — стальная рамка
    board.add(mesh(new THREE.BoxGeometry(0.66, 0.006, 0.42), std({ color: 0x10231d, metalness: 0.2, roughness: 0.45 }), -0.05, 0.0355, -0.56));
    board.add(mesh(plate(0.7, 0.46, 0.006, 0.02, [[0.6, 0.36, 0.012, 0, 0]]), mat.shield(), -0.05, 0.0405, -0.56));
    board.add(mesh(rbox(0.3, 0.016, 0.3, 0.004), mat.chip(), -0.17, 0.0465, -0.56));
    const chipTex = tex.chipTextures();
    refs.die = std({ map: chipTex.map, emissiveMap: chipTex.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0, metalness: 0.4, roughness: 0.24 });
    board.add(mesh(faceUp(0.292, 0.292), refs.die, -0.17, 0.0549, -0.56, false));
    // Ореол вокруг чипа — загорается в главе про него
    refs.chipGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex.glowTexture(), color: 0xff6f9c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    refs.chipGlow.position.set(-0.17, 0.062, -0.56);
    refs.chipGlow.scale.setScalar(1.25);
    board.add(refs.chipGlow);
    const ramLabel = mat.decal(tex.chipLabelTexture(['LPDDR5X', '16 GB', 'VS-M16'], true));
    for (const x of [0.07, 0.185]) {
      board.add(mesh(new THREE.BoxGeometry(0.1, 0.012, 0.24), mat.chip(), x, 0.0445, -0.56));
      board.add(mesh(faceUp(0.22, 0.09).rotateY(Math.PI / 2), ramLabel, x, 0.0507, -0.56, false));
    }
    anchor('cpu', board, -0.03, 0.056, -0.5);
    anchor('ram', board, 0.235, 0.051, -0.62);

    const chipMat = mat.chip();
    const chip = (w, d, x, z, label) => {
      board.add(mesh(new THREE.BoxGeometry(w, 0.014, d), chipMat, x, 0.0395, z));
      if (label) board.add(mesh(faceUp(w - 0.012, d - 0.012), mat.decal(tex.chipLabelTexture(label, w / d > 1.3)), x, 0.0467, z, false));
    };
    chip(0.3, 0.17, -0.68, -0.43, ['NAND', '512 GB  VS-N5']);      // накопитель
    chip(0.3, 0.17, -0.68, -0.66, ['NAND', '512 GB  VS-N5']);
    chip(0.14, 0.14, -0.5, -0.22, ['VS-C2', 'SSD CTRL']);          // контроллер накопителя
    chip(0.14, 0.14, 0.46, -0.3, ['PMU 7', '2641']);               // питание
    chip(0.18, 0.12, 0.76, -0.28, ['USB-C', 'RT 40G']);
    chip(0.5, 0.05, 0.36, -0.15);                                  // разъём батареи
    // Экраны из стали над радиочастью
    const shieldMat = mat.shield();
    board.add(mesh(rbox(0.46, 0.022, 0.3, 0.006), shieldMat, 0.64, 0.0435, -0.64));
    board.add(mesh(rbox(0.24, 0.02, 0.18, 0.006), shieldMat, -0.78, 0.0425, -0.22));
    const screwHead = new THREE.CylinderGeometry(0.022, 0.022, 0.006, 18);
    const screwSlot = new THREE.CylinderGeometry(0.009, 0.009, 0.0062, 6);
    const screwMat = mat.silver(), slotMat = mat.black();
    for (const sx of [-0.9, 0.9]) for (const sz of [-0.15, -0.97]) {
      board.add(mesh(screwHead, screwMat, sx, 0.0355, sz));
      board.add(mesh(screwSlot, slotMat, sx, 0.0358, sz, false));
    }
    anchor('ssd', board, -0.53, 0.047, -0.43);
    anchor('board', board, 0.95, 0.03, -0.3);

    // Мелкая обвязка: конденсаторы и дроссели россыпью, мимо крупных деталей
    const keepOut = [[-0.05, -0.56, 0.76, 0.52], [0.64, -0.64, 0.5, 0.34], [-0.68, -0.545, 0.36, 0.46], [-0.5, -0.22, 0.2, 0.2],
      [-0.78, -0.22, 0.3, 0.24], [0.46, -0.3, 0.2, 0.2], [0.76, -0.28, 0.24, 0.18], [0.36, -0.15, 0.56, 0.1],
      [-0.9, -0.15, 0.08, 0.08], [0.9, -0.15, 0.08, 0.08], [-0.9, -0.97, 0.08, 0.08], [0.9, -0.97, 0.08, 0.08]];
    const sizes = [[0.03, 0.012, 0.016], [0.018, 0.01, 0.03], [0.05, 0.02, 0.05], [0.022, 0.012, 0.022]];
    const tones = [0x8a6f4d, 0x15171a, 0x9da2a9, 0x2a2e35, 0x8a6f4d];
    const bits = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std({ metalness: 0.3, roughness: 0.5 }), 190);
    const m4 = new THREE.Matrix4(), tone = new THREE.Color();
    let placed = 0;
    while (placed < bits.count) {
      const x = (rand() - 0.5) * 1.8, z = -0.56 + (rand() - 0.5) * 0.84;
      if (keepOut.some(([cx, cz, w, d]) => Math.abs(x - cx) < w / 2 && Math.abs(z - cz) < d / 2)) continue;
      const s = sizes[Math.floor(rand() * sizes.length)];
      m4.makeScale(s[0], s[1], s[2]).setPosition(x, 0.0325 + s[1] / 2, z);
      bits.setMatrixAt(placed, m4);
      bits.setColorAt(placed, tone.setHex(tones[Math.floor(rand() * tones.length)]));
      placed++;
    }
    bits.castShadow = bits.receiveShadow = true;
    board.add(bits);

    /* ===== Охлаждение ===== */
    const cooling = part('cooling', root);
    const copper = mat.copper();
    cooling.add(mesh(rbox(0.7, 0.008, 0.46, 0.003), copper, -0.05, 0.06, -0.56));      // пластина над чипом
    cooling.add(mesh(rbox(0.08, 0.01, 0.5, 0.004), copper, -0.05, 0.069, -0.78));      // трубка назад
    cooling.add(mesh(rbox(2.9, 0.01, 0.08, 0.004), copper, 0, 0.069, -0.99));          // трубка к рёбрам
    anchor('pipe', cooling, 0.6, 0.074, -0.99);
    anchor('cooling', cooling, 1.48, 0.06, -0.6);

    const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.006, 0.044, 0.12), mat.fin(), 54);
    for (let i = 0; i < 54; i++) {
      const side = i < 27 ? -1 : 1;
      m4.makeTranslation(side * (0.99 + (i % 27) * 0.018), 0.04, -0.99);
      fins.setMatrixAt(i, m4);
    }
    fins.castShadow = fins.receiveShadow = true;
    cooling.add(fins);
    anchor('fins', cooling, 1.3, 0.062, -1.04);

    const fanBody = mat.plastic();
    const fanWall = mat.plastic();
    fanWall.side = THREE.DoubleSide;
    const bladeMat = std({ color: 0x1b1d21, metalness: 0.15, roughness: 0.46 });
    const hubMat = mat.plastic(), hubLabel = mat.silver();
    const blades = [];
    const blade = new THREE.BoxGeometry(0.11, 0.034, 0.004);
    const turn = new THREE.Matrix4(), out = new THREE.Matrix4(), sweep = new THREE.Matrix4();
    for (let i = 0; i < 37; i++) {
      turn.makeRotationY((i / 37) * Math.PI * 2).multiply(out.makeTranslation(0.135, 0, 0)).multiply(sweep.makeRotationY(0.6));
      blades.push(blade.clone().applyMatrix4(turn));
    }
    const bladesGeo = mergeGeometries(blades);
    for (const side of [-1, 1]) {
      const x = side * 1.22, z = -0.6;
      cooling.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.006, 48), fanBody, x, 0.019, z));
      cooling.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.046, 48, 1, true), fanWall, x, 0.042, z));
      cooling.add(mesh(new THREE.RingGeometry(0.2, 0.262, 48).rotateX(-Math.PI / 2), fanBody, x, 0.0655, z));
      const impeller = new THREE.Group();
      impeller.position.set(x, 0.042, z);
      impeller.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 32), hubMat));
      impeller.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.002, 32), hubLabel, 0, 0.021, 0));
      impeller.add(mesh(bladesGeo, bladeMat));
      cooling.add(impeller);
      refs.impellers.push(impeller);
    }
    anchor('fan', cooling, 1.42, 0.066, -0.5);

    // Поток воздуха: светлые штрихи, уходящие от рёбер назад
    refs.air = new THREE.InstancedMesh(
      faceUp(0.014, 0.17),
      new THREE.MeshBasicMaterial({ color: 0xffd2a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
      28,
    );
    for (let i = 0; i < 28; i++) refs.airLanes.push({ x: (i < 14 ? -1 : 1) * (0.99 + rand() * 0.46), phase: rand() });
    refs.air.visible = false;
    refs.air.frustumCulled = false;
    cooling.add(refs.air);

    /* ===== Батарея ===== */
    const battery = part('battery', root);
    const cellMat = mat.cell();
    const cellLabel = mat.decal(tex.batteryLabelTexture());
    const trackMat = std({ color: 0x050506, roughness: 0.6 });
    const chargeMat = std({ color: 0x3a2413, emissive: 0xff9a52, emissiveIntensity: 1.5, roughness: 0.5 });
    for (const [cx, cw] of [[0, 0.98], [-0.88, 0.72], [0.88, 0.72]]) {
      battery.add(mesh(rbox(cw, 0.055, 0.86, 0.018), cellMat, cx, 0.046, 0.57));
      battery.add(mesh(faceUp(0.44, 0.22), cellLabel, cx - cw / 2 + 0.27, 0.0738, 0.36, false));
      const len = cw - 0.14;
      battery.add(mesh(new THREE.BoxGeometry(len, 0.002, 0.036), trackMat, cx, 0.0743, 0.88));
      // Полоска заряда растёт слева направо, пока вы листаете главу про батарею
      const bar = mesh(new THREE.BoxGeometry(len, 0.003, 0.022).translate(len / 2, 0, 0), chargeMat, cx - len / 2, 0.0752, 0.88, false);
      bar.scale.x = 0.001;
      battery.add(bar);
      refs.bars.push(bar);
    }
    battery.add(mesh(new THREE.BoxGeometry(2.6, 0.01, 0.06), std({ color: 0x0a0b0d, metalness: 0.2, roughness: 0.5 }), 0, 0.03, 0.08));
    for (const x of [-0.9, -0.2, 0.55]) battery.add(mesh(new THREE.BoxGeometry(0.12, 0.012, 0.045), mat.chip(), x, 0.041, 0.08));
    anchor('battery', battery, 1.24, 0.06, 0.8);
    anchor('cells', battery, 1.2, 0.074, 0.55);
    anchor('bms', battery, 1.26, 0.035, 0.08);

    /* ===== Динамики ===== */
    const speakers = part('speakers', root);
    const boxMat = mat.plastic(), coneMat = std({ color: 0x2a2d33, metalness: 0.7, roughness: 0.32 });
    const capMat = mat.silver(), surroundMat = std({ color: 0x08090a, roughness: 0.75 });
    const surround = new THREE.TorusGeometry(0.062, 0.011, 10, 36).rotateX(Math.PI / 2);
    const cone = new THREE.CylinderGeometry(0.056, 0.056, 0.004, 32);
    const cap = new THREE.SphereGeometry(0.024, 20, 12).scale(1, 0.4, 1);
    const tweeter = new THREE.CylinderGeometry(0.034, 0.034, 0.006, 24);
    const ringGeo = new THREE.RingGeometry(0.066, 0.074, 48).rotateX(-Math.PI / 2);
    for (const side of [-1, 1]) {
      const x = side * 1.4;
      speakers.add(mesh(rbox(0.2, 0.05, 1.0, 0.015), boxMat, x, 0.043, 0.45));
      for (const z of [0.44, 0.78]) {
        speakers.add(mesh(surround, surroundMat, x, 0.069, z));
        speakers.add(mesh(cone, coneMat, x, 0.069, z));
        speakers.add(mesh(cap, capMat, x, 0.071, z));
        for (let k = 0; k < 2; k++) {
          const ring = mesh(ringGeo, new THREE.MeshBasicMaterial({
            color: 0xffb37a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
          }), x, 0.085, z, false);
          ring.visible = false;
          speakers.add(ring);
          refs.rings.push(ring);
        }
      }
      speakers.add(mesh(tweeter, capMat, x, 0.07, 0.08));
    }
    anchor('speakers', speakers, 1.5, 0.06, 0.6);
    anchor('woofer', speakers, 1.48, 0.072, 0.62);
    anchor('tweeter', speakers, 1.45, 0.073, 0.08);

    /* ===== Верхняя панель: рама, стенки, петля, решётки, разъёмы, а на ней крышка с экраном ===== */
    const topcase = part('topcase', root);
    const bodyMat = mat.alu();
    topcase.add(mesh(plate(W, D, 0.014, R, [
      [KB_W + 0.03, KB_D + 0.03, 0.03, 0, KB_CZ],
      [1.376, 0.846, 0.035, 0, 0.615],
    ]), bodyMat, 0, 0.098, 0));
    topcase.add(mesh(plate(W, D, 0.079, R, [[W - 0.05, D - 0.05, R - 0.025, 0, 0]]), bodyMat, 0, 0.0515, 0));
    topcase.add(mesh(new THREE.CylinderGeometry(0.034, 0.034, 2.5, 24).rotateZ(Math.PI / 2), mat.plastic(), 0, 0.112, -1.085));
    const grillMat = std({ map: tex.grillTexture(), transparent: true, roughness: 0.8 });
    for (const side of [-1, 1]) topcase.add(mesh(faceUp(0.1, 0.86), grillMat, side * 1.455, 0.1053, -0.44, false));

    // Разъёмы на боковых стенках: слева зарядка, два USB-C и наушники, справа HDMI, USB-C и карта памяти
    const portMat = mat.black();
    const port = (side, z, w, h, r) => {
      const g = new THREE.ShapeGeometry(roundedRect(new THREE.Shape(), w, h, r), 8).rotateY(side * Math.PI / 2);
      topcase.add(mesh(g, portMat, side * 1.5606, 0.052, z, false));
    };
    port(-1, -0.86, 0.17, 0.03, 0.0149);
    port(-1, -0.62, 0.09, 0.028, 0.0139);
    port(-1, -0.46, 0.09, 0.028, 0.0139);
    port(-1, 0.74, 0.034, 0.034, 0.0169);
    port(1, -0.84, 0.15, 0.046, 0.008);
    port(1, -0.6, 0.09, 0.028, 0.0139);
    port(1, -0.3, 0.25, 0.014, 0.004);
    anchor('topcase', topcase, 1.56, 0.098, 0.95);
    anchor('hinge', topcase, 1.2, 0.13, -1.085);

    /* ===== Трекпад ===== */
    const trackpad = part('trackpad', root);
    trackpad.add(mesh(plate(1.36, 0.83, 0.012, 0.03), mat.aluSoft(), 0, 0.099, 0.615));
    anchor('trackpad', trackpad, 0.68, 0.105, 0.62);

    /* ===== Клавиатура: подложка со светодиодами и клавиши с надписями ===== */
    const keys = keyLayout();
    const kbBox = { w: KB_W, d: KB_D, cx: 0, cz: KB_CZ };
    const keyplate = part('keyplate', root);
    keyplate.add(mesh(plate(KB_W + 0.01, KB_D + 0.01, 0.01, 0.02), mat.plastic(), 0, 0.08, KB_CZ));
    refs.keyGlow = mat.glow(tex.keyLedTexture(keys, kbBox));
    keyplate.add(mesh(faceUp(KB_W, KB_D), refs.keyGlow, 0, 0.0853, KB_CZ, false));
    anchor('keyplate', keyplate, KB_W / 2, 0.085, -0.88);

    const keycaps = part('keycaps', root);
    const capGeos = new Map();
    const merged = keys.map((k) => {
      const id = k.w.toFixed(3) + 'x' + k.d.toFixed(3);
      if (!capGeos.has(id)) capGeos.set(id, new RoundedBoxGeometry(k.w, 0.018, k.d, 2, 0.007));
      return capGeos.get(id).clone().translate(k.x, 0.097, k.z);
    });
    keycaps.add(mesh(mergeGeometries(merged), mat.key()));
    // Надписи лежат тонким слоем на клавишах и светятся вместе с подсветкой
    refs.legend = new THREE.MeshBasicMaterial({
      map: tex.keyLegendTexture(keys, kbBox), transparent: true, depthWrite: false, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -2,
    });
    keycaps.add(mesh(faceUp(KB_W, KB_D), refs.legend, 0, 0.1064, KB_CZ, false));
    anchor('keycaps', keycaps, KB_W / 2, 0.106, -0.4);

    /* ===== Крышка: вращается вокруг петли; слои экрана расходятся по её нормали ===== */
    const lid = new THREE.Group();
    lid.position.set(0, 0.11, -1.085);
    topcase.add(lid);
    refs.lid = lid;
    const LZ = LID_D / 2;

    const shell = part('shell', lid);
    const shellMat = mat.alu();
    shell.add(mesh(plate(W, LID_D, 0.014, R), shellMat, 0, 0.041, LZ));
    shell.add(mesh(plate(W, LID_D, 0.034, R, [[W - 0.04, LID_D - 0.04, R - 0.02, 0, 0]]), shellMat, 0, 0.017, LZ));
    const logo = new THREE.Shape();
    logo.moveTo(-0.012, 0.17); logo.lineTo(-0.012, -0.1); logo.lineTo(-0.15, -0.1); logo.closePath();
    const jib = new THREE.Shape();
    jib.moveTo(0.02, 0.11); jib.lineTo(0.02, -0.1); jib.lineTo(0.12, -0.1); jib.closePath();
    const logoGeo = new THREE.ShapeGeometry([logo, jib]).rotateX(-Math.PI / 2).rotateY(Math.PI);
    shell.add(mesh(logoGeo, std({ color: 0xf2f4f6, metalness: 1, roughness: 0.06 }), 0, 0.0484, LZ, false));
    anchor('shell', shell, 1.5, 0.041, 2.05);

    const backlight = part('backlight', lid);
    backlight.add(mesh(plate(2.98, 2.0, 0.008, 0.02), std({ color: 0xd6dbe1, metalness: 0, roughness: 0.9 }), 0, 0.022, LZ));
    refs.leds = mat.glow(tex.ledGridTexture());
    backlight.add(mesh(faceDown(2.94, 1.96), refs.leds, 0, 0.0177, LZ, false));
    anchor('backlight', backlight, 1.48, 0.022, 1.7);

    const panel = part('panel', lid);
    panel.add(mesh(plate(2.98, 2.0, 0.008, 0.02), mat.chip(), 0, 0.012, LZ));
    refs.screen = mat.glow(tex.screenTexture());
    panel.add(mesh(faceDown(2.94, 1.96), refs.screen, 0, 0.0077, LZ, false));
    anchor('panel', panel, 1.48, 0.012, 1.35);

    const glass = part('glass', lid);
    glass.add(mesh(plate(3.08, 2.15, 0.004, R - 0.02, [[2.94, 1.96, 0.02, 0, 0]]),
      std({ color: 0x030304, metalness: 0.2, roughness: 0.1 }), 0, 0.003, LZ));
    glass.add(mesh(faceDown(2.96, 1.98), new THREE.MeshPhysicalMaterial({
      color: 0xbfd0e0, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false,
    }), 0, 0.0015, LZ, false));
    // Объектив камеры в вырезе экрана
    glass.add(mesh(new THREE.CircleGeometry(0.012, 20).rotateX(Math.PI / 2), std({ color: 0x18222f, metalness: 0.7, roughness: 0.08 }), 0, 0.0006, LZ + 0.952, false));
    anchor('glass', glass, 1.52, 0.003, 1.0);

    // Материалы каждой детали основания — для приглушения в крупных планах
    for (const name of ['bottom', 'board', 'cooling', 'battery', 'speakers', 'topcase', 'trackpad', 'keyplate', 'keycaps']) {
      const set = new Set();
      parts[name].traverse((o) => {
        if (o.isMesh && o.material.isMeshStandardMaterial) set.add(o.material);
      });
      for (const m of set) m.userData.color0 = m.color.clone();
      parts[name].userData.mats = [...set];
      parts[name].userData.dim = 0;
    }

    return { root, parts, anchors, refs };
  }

  V.buildLaptop = buildLaptop;
  V.LID_OPEN = LID_OPEN;
})(window.Vela);
