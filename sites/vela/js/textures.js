/* Текстуры, нарисованные на canvas: экран, надписи на клавишах, плата, чип, наклейки */
(function (V) {
  if (!V) return;
  const THREE = V.THREE;

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return [c, c.getContext('2d')];
  }

  function texture(c) {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }

  // Генератор с зерном: детали выглядят случайно, но одинаково при каждой загрузке
  function rng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function roundRect(x, px, py, w, h, r) {
    x.beginPath();
    if (x.roundRect) x.roundRect(px, py, w, h, r);
    else x.rect(px, py, w, h);
  }

  const FONT = 'system-ui, "Segoe UI", Roboto, sans-serif';

  // Знак Vela — два паруса; s — высота знака в пикселях
  function sailMark(x, cx, cy, s) {
    x.beginPath();
    x.moveTo(cx - 0.04 * s, cy - 0.5 * s);
    x.lineTo(cx - 0.04 * s, cy + 0.5 * s);
    x.lineTo(cx - 0.55 * s, cy + 0.5 * s);
    x.closePath();
    x.moveTo(cx + 0.08 * s, cy - 0.28 * s);
    x.lineTo(cx + 0.08 * s, cy + 0.5 * s);
    x.lineTo(cx + 0.45 * s, cy + 0.5 * s);
    x.closePath();
  }

  /* ---------- Мелкое зерно пескоструйного алюминия: карта шероховатости ---------- */
  function grainTexture() {
    const [c, x] = canvas(256, 256);
    const r = rng(3);
    const img = x.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 205 + Math.floor(r() * 50);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(10, 10);
    t.anisotropy = 4;
    return t;
  }

  /* ---------- Экран: обои, строка меню с вырезом камеры, док ---------- */
  function screenTexture() {
    const [c, x] = canvas(1920, 1280);
    const w = c.width, h = c.height;

    // Обои рисуются на маленьком холсте и растягиваются — так цветовые пятна плавно перетекают друг в друга
    const [small, s] = canvas(96, 64);
    s.fillStyle = '#060b24';
    s.fillRect(0, 0, 96, 64);
    const blob = (cx, cy, rad, color) => {
      const g = s.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      s.fillStyle = g;
      s.fillRect(0, 0, 96, 64);
    };
    blob(18, 60, 46, 'rgba(36, 74, 214, 0.95)');
    blob(52, 70, 40, 'rgba(126, 58, 214, 0.9)');
    blob(84, 52, 38, 'rgba(238, 66, 128, 0.92)');
    blob(98, 22, 34, 'rgba(255, 150, 72, 0.95)');
    blob(70, 34, 20, 'rgba(255, 204, 128, 0.55)');
    blob(8, 8, 36, 'rgba(10, 24, 86, 0.9)');
    x.imageSmoothingQuality = 'high';
    x.drawImage(small, 0, 0, w, h);

    // Паруса: Vela — «парус» на латыни
    const sail = (x0, tx, ty, x1, alpha) => {
      const g = x.createLinearGradient(tx, ty, tx, h);
      g.addColorStop(0, 'rgba(255, 255, 255, ' + alpha + ')');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      x.beginPath();
      x.moveTo(x0, h);
      x.quadraticCurveTo(x0 + (x1 - x0) * 0.12, h * 0.5, tx, ty);
      x.quadraticCurveTo(x1 - (x1 - x0) * 0.1, h * 0.64, x1, h);
      x.closePath();
      x.fillStyle = g;
      x.fill();
    };
    sail(w * 0.1, w * 0.44, h * 0.14, w * 0.62, 0.2);
    sail(w * 0.34, w * 0.68, h * 0.26, w * 0.88, 0.16);
    sail(w * 0.6, w * 0.92, h * 0.42, w * 1.08, 0.12);

    // Строка меню
    x.fillStyle = 'rgba(8, 10, 20, 0.28)';
    x.fillRect(0, 0, w, 40);
    x.fillStyle = 'rgba(255, 255, 255, 0.94)';
    x.textBaseline = 'middle';
    x.font = '600 20px ' + FONT;
    x.fillText('Vela', 28, 21);
    x.font = '400 19px ' + FONT;
    ['Файл', 'Правка', 'Вид', 'Окно', 'Справка'].forEach((t, i) => x.fillText(t, 102 + i * 92, 21));
    x.textAlign = 'right';
    x.fillText('9:41', w - 28, 21);

    // Вырез под камеру
    x.fillStyle = '#000';
    roundRect(x, w / 2 - 110, -14, 220, 54, 14);
    x.fill();

    // Док
    const n = 8, sz = 62, gap = 16, dw = n * sz + (n + 1) * gap, dx = (w - dw) / 2, dy = h - 112;
    x.fillStyle = 'rgba(255, 255, 255, 0.22)';
    roundRect(x, dx, dy, dw, sz + 2 * gap, 26);
    x.fill();
    const tints = [['#fdfdfd', '#c9ced6'], ['#ffb46a', '#ff6a3d'], ['#6fc1ff', '#2a6cf0'], ['#7df0c2', '#18a777'],
      ['#ff8fb0', '#e83e6c'], ['#c9a2ff', '#6d3be0'], ['#ffe07a', '#f3a51c'], ['#e6e9ee', '#8c94a0']];
    tints.forEach(([a, b], i) => {
      const ix = dx + gap + i * (sz + gap), iy = dy + gap;
      const g = x.createLinearGradient(0, iy, 0, iy + sz);
      g.addColorStop(0, a);
      g.addColorStop(1, b);
      x.fillStyle = g;
      roundRect(x, ix, iy, sz, sz, 15);
      x.fill();
    });

    return texture(c);
  }

  // Сетка мини-светодиодов подсветки экрана
  function ledGridTexture() {
    const [c, x] = canvas(960, 640);
    x.fillStyle = '#07080a';
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#fff6e8';
    for (let j = 0; j < 32; j++) {
      for (let i = 0; i < 48; i++) {
        x.beginPath();
        x.arc(10 + i * 20, 10 + j * 20, 3.4, 0, Math.PI * 2);
        x.fill();
      }
    }
    return texture(c);
  }

  // Светодиод под каждой клавишей; keys — раскладка из model.js, box — габариты подложки
  function keyLedTexture(keys, box) {
    const [c, x] = canvas(1024, Math.round(1024 * box.d / box.w));
    x.fillStyle = '#0a0b0d';
    x.fillRect(0, 0, c.width, c.height);
    for (const k of keys) {
      const px = ((k.x - box.cx) / box.w + 0.5) * c.width;
      const py = ((k.z - box.cz) / box.d + 0.5) * c.height;
      const g = x.createRadialGradient(px, py, 0, px, py, 15);
      g.addColorStop(0, 'rgba(255, 244, 228, 1)');
      g.addColorStop(0.3, 'rgba(255, 226, 190, 0.5)');
      g.addColorStop(1, 'rgba(255, 226, 190, 0)');
      x.fillStyle = g;
      x.fillRect(px - 15, py - 15, 30, 30);
    }
    return texture(c);
  }

  // Надписи на клавишах: латиница и кириллица, как на русской раскладке
  function keyLegendTexture(keys, box) {
    const [c, x] = canvas(2048, Math.round(2048 * box.d / box.w));
    const scale = c.width / box.w;
    x.fillStyle = 'rgba(238, 241, 245, 0.95)';
    x.textBaseline = 'middle';
    for (const k of keys) {
      if (!k.label) continue;
      const px = ((k.x - box.cx) / box.w + 0.5) * c.width;
      const py = ((k.z - box.cz) / box.d + 0.5) * c.height;
      const kw = k.w * scale, kh = k.d * scale;
      const label = k.label;

      if ('<>^v'.includes(label)) {                     // стрелки
        const a = 9;
        const dir = { '<': [-1, 0], '>': [1, 0], '^': [0, -1], v: [0, 1] }[label];
        x.beginPath();
        x.moveTo(px + dir[0] * a, py + dir[1] * a);
        x.lineTo(px - dir[0] * a * 0.6 + dir[1] * a, py - dir[1] * a * 0.6 + dir[0] * a);
        x.lineTo(px - dir[0] * a * 0.6 - dir[1] * a, py - dir[1] * a * 0.6 - dir[0] * a);
        x.closePath();
        x.fill();
      } else if (label.length > 1) {                    // служебные: слово в нижнем углу
        const fnRow = kh < 80;
        x.font = '500 ' + (fnRow ? 19 : 23) + 'px ' + FONT;
        if (fnRow) {
          x.textAlign = 'center';
          x.fillText(label, px, py + 1);
        } else {
          const right = k.x > 0;
          x.textAlign = right ? 'right' : 'left';
          x.fillText(label, px + (right ? 1 : -1) * (kw / 2 - 15), py + kh / 2 - 24);
        }
      } else if (k.sub) {                               // буквы: латинская и русская
        x.textAlign = 'center';
        x.font = '500 44px ' + FONT;
        x.fillText(label, px - kw * 0.17, py - kh * 0.12);
        x.font = '500 36px ' + FONT;
        x.fillText(k.sub, px + kw * 0.2, py + kh * 0.2);
      } else {                                          // цифры и знаки
        x.textAlign = 'center';
        x.font = '500 42px ' + FONT;
        x.fillText(label, px, py + 2);
      }
    }
    return texture(c);
  }

  /* ---------- Плата: чёрный текстолит, дорожки, площадки, белая маркировка ---------- */
  function pcbTexture() {
    const [c, x] = canvas(2048, 1024);
    const r = rng(7);
    x.fillStyle = '#0a0b0d';
    x.fillRect(0, 0, c.width, c.height);
    x.lineWidth = 3;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    for (let i = 0; i < 260; i++) {
      let px = r() * c.width, py = r() * c.height;
      let horizontal = r() > 0.5;
      x.strokeStyle = r() > 0.4 ? '#17191d' : '#1e2126';
      x.beginPath();
      x.moveTo(px, py);
      const turns = 2 + Math.floor(r() * 4);
      for (let j = 0; j < turns; j++) {
        const len = (40 + r() * 220) * (r() > 0.5 ? 1 : -1);
        if (horizontal) px += len; else py += len;
        x.lineTo(px, py);
        px += 14 * Math.sign(len);
        py += 14 * (r() > 0.5 ? 1 : -1);
        x.lineTo(px, py);
        horizontal = !horizontal;
      }
      x.stroke();
      x.fillStyle = r() > 0.5 ? '#b8963f' : '#8f9399';
      x.beginPath();
      x.arc(px, py, 4.5, 0, Math.PI * 2);
      x.fill();
    }
    // Ряды контактных площадок
    for (let i = 0; i < 26; i++) {
      const px = r() * (c.width - 200), py = r() * (c.height - 60);
      const vertical = r() > 0.5, count = 6 + Math.floor(r() * 12);
      x.fillStyle = '#b8963f';
      for (let j = 0; j < count; j++) x.fillRect(px + (vertical ? 0 : j * 9), py + (vertical ? j * 9 : 0), vertical ? 16 : 5, vertical ? 5 : 16);
    }
    // Шелкография
    x.fillStyle = 'rgba(226, 229, 233, 0.62)';
    x.font = '500 15px ' + FONT;
    const marks = ['C', 'R', 'U', 'L', 'J', 'TP', 'Q'];
    for (let i = 0; i < 150; i++) {
      x.fillText(marks[Math.floor(r() * marks.length)] + Math.floor(100 + r() * 8900), r() * c.width, r() * c.height);
    }
    x.font = '600 22px ' + FONT;
    x.fillText('VELA 14  MLB  820-0714-A', 60, c.height - 40);
    return texture(c);
  }

  /* ---------- Чип: гравировка и та же гравировка как карта свечения ---------- */
  function chipTextures() {
    const draw = (glow) => {
      const [c, x] = canvas(512, 512);
      if (glow) {
        x.fillStyle = '#000';
        x.fillRect(0, 0, 512, 512);
      } else {
        const g = x.createLinearGradient(0, 0, 512, 512);
        g.addColorStop(0, '#15171b');
        g.addColorStop(0.5, '#0a0b0d');
        g.addColorStop(1, '#121317');
        x.fillStyle = g;
        x.fillRect(0, 0, 512, 512);
        x.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        x.lineWidth = 3;
        roundRect(x, 14, 14, 484, 484, 18);
        x.stroke();
      }
      let ink = '#3c3f46';
      if (glow) {
        ink = x.createLinearGradient(110, 150, 400, 360);
        ink.addColorStop(0, '#ffb066');
        ink.addColorStop(0.5, '#ff4f8b');
        ink.addColorStop(1, '#7a5cff');
      }
      x.fillStyle = ink;
      sailMark(x, 176, 244, 150);
      x.fill();
      x.textBaseline = 'middle';
      x.textAlign = 'left';
      x.font = '700 190px ' + FONT;
      x.fillText('V1', 232, 256);
      if (!glow) {
        x.fillStyle = '#32353b';
        x.font = '500 20px ' + FONT;
        x.fillText('VELA SILICON   12C   3NM', 56, 424);
        x.fillText('VS1-0714   2641', 56, 452);
        x.beginPath();
        x.arc(60, 60, 9, 0, Math.PI * 2);
        x.fill();
      }
      return texture(c);
    };
    return { map: draw(false), emissiveMap: draw(true) };
  }

  // Маркировка обычной микросхемы: пара строк и точка первого вывода
  function chipLabelTexture(lines, wide) {
    const [c, x] = canvas(wide ? 384 : 256, 256);
    x.fillStyle = '#0d0e11';
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#5b5f67';
    x.beginPath();
    x.arc(30, 30, 9, 0, Math.PI * 2);
    x.fill();
    x.textBaseline = 'middle';
    x.font = '600 34px ' + FONT;
    x.fillText(lines[0], 30, 104);
    x.font = '500 24px ' + FONT;
    lines.slice(1).forEach((t, i) => x.fillText(t, 30, 152 + i * 34));
    return texture(c);
  }

  // Наклейка на ячейке батареи
  function batteryLabelTexture() {
    const [c, x] = canvas(768, 384);
    x.fillStyle = '#e9ebee';
    x.textBaseline = 'middle';
    x.font = '600 34px ' + FONT;
    x.fillText('Литий-полимерная батарея', 24, 40);
    x.font = '400 26px ' + FONT;
    ['11,4 В    72 Вт·ч    6310 мА·ч', 'Модель V14-B3   Vela Inc.', 'Не прокалывать и не нагревать.', 'Заменять только в сервисе.'].forEach((t, i) => x.fillText(t, 24, 94 + i * 38));
    x.lineWidth = 3;
    x.strokeStyle = '#e9ebee';
    for (let i = 0; i < 4; i++) {
      roundRect(x, 24 + i * 78, 262, 60, 60, 6);
      x.stroke();
    }
    x.beginPath();                                      // значок «не выбрасывать»
    x.moveTo(34, 272); x.lineTo(74, 312); x.moveTo(74, 272); x.lineTo(34, 312);
    x.stroke();
    x.beginPath();
    x.moveTo(132, 310); x.lineTo(132, 276); x.lineTo(148, 290); x.moveTo(132, 276); x.lineTo(116, 290);
    x.stroke();
    const r = rng(11);                                  // штрихкод
    let bx = 420;
    while (bx < 740) {
      const bw = 2 + Math.floor(r() * 5);
      x.fillRect(bx, 262, bw, 60);
      bx += bw + 2 + Math.floor(r() * 5);
    }
    return texture(c);
  }

  // Перфорация решётки динамика
  function grillTexture() {
    const [c, x] = canvas(48, 384);
    x.fillStyle = '#050506';
    for (let j = 0; j < 64; j++) {
      for (let i = 0; i < 8; i++) {
        x.beginPath();
        x.arc(3 + i * 6, 3 + j * 6, 1.7, 0, Math.PI * 2);
        x.fill();
      }
    }
    return texture(c);
  }

  // Мягкое пятно света — ореол вокруг светящегося чипа
  function glowTexture() {
    const [c, x] = canvas(256, 256);
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    g.addColorStop(0.25, 'rgba(255, 255, 255, 0.34)');
    g.addColorStop(0.6, 'rgba(255, 255, 255, 0.08)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    return texture(c);
  }

  V.tex = {
    rng, grainTexture, screenTexture, ledGridTexture, keyLedTexture, keyLegendTexture, pcbTexture,
    chipTextures, chipLabelTexture, batteryLabelTexture, grillTexture, glowTexture,
  };
})(window.Vela);
