/* Всё, что лежит поверх холста: тексты глав, подписи с выносками, полоска глав в шапке */
(function (V) {
  if (!V) return;
  const THREE = V.THREE;
  const { presence } = V.story;

  const SVG = 'http://www.w3.org/2000/svg';

  function createOverlay({ stage, camera, anchors }) {
    const chapters = [...stage.querySelectorAll('.chapter')];
    const copies = chapters.map((ch) => ({ el: ch.querySelector('.copy'), o: -1 }));
    const hint = stage.querySelector('.scroll-hint');
    const svg = stage.querySelector('.leaders');
    const railLinks = [...document.querySelectorAll('.rail a')];
    const railNow = document.querySelector('.rail-now');
    let current = -1;

    const labels = [];
    chapters.forEach((ch, i) => {
      ch.querySelectorAll('.part').forEach((el) => {
        const anchor = anchors[el.dataset.anchor];
        if (!anchor) return;
        const line = svg.appendChild(document.createElementNS(SVG, 'line'));
        const dot = svg.appendChild(document.createElementNS(SVG, 'circle'));
        dot.setAttribute('r', 4);
        line.style.opacity = dot.style.opacity = 0;
        labels.push({ el, anchor, i, line, dot, w: 0, h: 0, ax: 0, ay: 0, y: 0, o: 0, shown: false });
      });
    });

    function measure() {
      for (const l of labels) {
        l.w = l.el.offsetWidth;
        l.h = l.el.offsetHeight;
      }
    }

    function fade(item, o, drift) {
      const el = item.el;
      if (o <= 0.004) {
        if (item.o !== 0) { el.style.opacity = 0; el.style.visibility = 'hidden'; item.o = 0; }
        return;
      }
      if (item.o <= 0.004) el.style.visibility = 'visible';
      item.o = o;
      el.style.opacity = o.toFixed(3);
      el.style.setProperty('--drift', drift.toFixed(1) + 'px');
    }

    function hide(l) {
      if (!l.shown) return;
      l.shown = false;
      l.el.style.opacity = 0;
      l.el.style.visibility = 'hidden';
      l.line.style.opacity = l.dot.style.opacity = 0;
    }

    // Подписи встают в колонку правее своих деталей и раздвигаются, чтобы не наезжать друг на друга
    function layout(list, env) {
      list.sort((a, b) => a.ay - b.ay);
      const edge = env.compact ? 10 : 20;
      let widest = 0, right = 0;
      for (const l of list) { widest = Math.max(widest, l.w); right = Math.max(right, l.ax); }
      const col = Math.max(edge, Math.min(right + (env.compact ? 30 : 44), env.W - widest - edge));
      const gap = env.compact ? 6 : 10;

      let y = -Infinity, want = 0, got = 0;
      for (const l of list) {
        const target = l.ay - l.h / 2;
        y = Math.max(target, y);
        l.y = y;
        y += l.h + gap;
        want += target;
        got += l.y;
      }
      let shift = (want - got) / list.length;
      const top = 76, bottom = env.compact ? env.H * 0.58 : env.H - 24;
      const first = list[0], last = list[list.length - 1];
      if (first.y + shift < top) shift = top - first.y;
      else if (last.y + last.h + shift > bottom) shift = Math.max(top - first.y, bottom - last.y - last.h);

      for (const l of list) {
        const ly = l.y + shift;
        const s = l.el.style;
        if (!l.shown) { l.shown = true; s.visibility = 'visible'; }
        s.opacity = l.o.toFixed(3);
        // На узком экране колонке тесно: каждая подпись прижимается к правому краю сама по себе
        const x = env.compact ? Math.max(edge, Math.min(right + 30, env.W - l.w - edge)) : col;
        s.transform = 'translate3d(' + x.toFixed(1) + 'px,' + ly.toFixed(1) + 'px,0)';
        l.line.setAttribute('x1', l.ax.toFixed(1));
        l.line.setAttribute('y1', l.ay.toFixed(1));
        l.line.setAttribute('x2', x.toFixed(1));
        l.line.setAttribute('y2', (ly + l.h / 2).toFixed(1));
        l.dot.setAttribute('cx', l.ax.toFixed(1));
        l.dot.setAttribute('cy', l.ay.toFixed(1));
        l.line.style.opacity = (l.o * 0.8).toFixed(3);
        l.dot.style.opacity = l.o.toFixed(3);
      }
    }

    const v = new THREE.Vector3();
    const groups = new Map();

    function update(t, env) {
      copies.forEach((c, i) => fade(c, presence(t, i, 0.12, 0.34), (i - t) * 70));

      hint.style.opacity = presence(t, 0, 0.02, 0.16).toFixed(3);

      groups.clear();
      for (const l of labels) {
        l.o = presence(t, l.i, 0.1, 0.3);
        if (l.o <= 0.004) { hide(l); continue; }
        l.anchor.getWorldPosition(v).project(camera);
        l.ax = (v.x * 0.5 + 0.5) * env.W;
        l.ay = (-v.y * 0.5 + 0.5) * env.H;
        if (!groups.has(l.i)) groups.set(l.i, []);
        groups.get(l.i).push(l);
      }
      for (const list of groups.values()) layout(list, env);

      const now = Math.round(t);
      if (now !== current) {
        current = now;
        railLinks.forEach((a, i) => {
          a.classList.toggle('is-past', i < now);
          a.classList.toggle('is-now', i === now);
          if (i === now) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
        });
        if (railLinks[now]) railNow.textContent = railLinks[now].title;
      }
    }

    return { update, measure, count: chapters.length };
  }

  V.createOverlay = createOverlay;
})(window.Vela);
