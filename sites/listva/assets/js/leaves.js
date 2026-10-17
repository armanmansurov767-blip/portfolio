/* листва. — падающие листья на canvas.
   Спрайты вырезаны из той же ветки, что и в герое, поэтому листья «родные». */
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const SPRITES = [1, 2, 3, 4, 5, 6, 7].map((i) => `assets/img/leaf-${i}.webp`);
  const rand = (a, b) => a + Math.random() * (b - a);

  const images = SPRITES.map((src) => {
    const img = new Image();
    img.src = src;
    img.decoding = "async";
    return img;
  });

  class LeafField {
    constructor(host, density) {
      this.host = host;
      this.density = density;
      this.canvas = document.createElement("canvas");
      this.canvas.className = "leaf-canvas";
      this.canvas.setAttribute("aria-hidden", "true");
      // после большого слова-подложки, но до ветки и текста — листья летят «в середине» сцены
      const word = host.querySelector(".hero__word, .phero__word");
      if (word) word.after(this.canvas); else host.prepend(this.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.leaves = [];
      this.running = false;
      this.last = 0;
      this.gust = 0;          // порыв ветра при прокрутке
      this.resize();

      addEventListener("resize", () => this.resize(), { passive: true });

      // рисуем, только когда секция на экране и вкладка активна
      const io = new IntersectionObserver(([e]) => (e.isIntersecting ? this.start() : this.stop()), { threshold: 0 });
      io.observe(host);
      document.addEventListener("visibilitychange", () => (document.hidden ? this.stop() : this.start()));

      let prevY = scrollY;
      addEventListener("scroll", () => {
        this.gust = Math.min(this.gust + Math.abs(scrollY - prevY) * 0.02, 6);
        prevY = scrollY;
      }, { passive: true });
    }

    resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = this.host.getBoundingClientRect();
      this.w = r.width;
      this.h = r.height;
      this.canvas.width = Math.round(this.w * dpr);
      this.canvas.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.round(this.density * (this.w < 720 ? 0.45 : 1));
      while (this.leaves.length < target) this.leaves.push(this.spawn(true));
      this.leaves.length = target;
    }

    spawn(anywhere = false) {
      const size = rand(this.w < 720 ? 16 : 22, this.w < 720 ? 38 : 62);
      return {
        img: images[(Math.random() * images.length) | 0],
        x: rand(-40, this.w + 40),
        y: anywhere ? rand(-this.h * 0.3, this.h) : rand(-160, -40),
        size,
        vy: rand(14, 34) * (size / 40),   // крупные падают чуть быстрее
        sway: rand(14, 46),               // размах качания
        swaySpeed: rand(0.25, 0.7),
        spin: rand(-0.55, 0.55),
        angle: rand(0, Math.PI * 2),
        flutter: rand(0.5, 1.4),          // переворот вокруг своей оси
        phase: rand(0, Math.PI * 2),
        alpha: rand(0.45, 0.9),
      };
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.last = performance.now();
      this.tick = (now) => {
        if (!this.running) return;
        const dt = Math.min((now - this.last) / 1000, 0.05);
        this.last = now;
        this.draw(dt, now / 1000);
        requestAnimationFrame(this.tick);
      };
      requestAnimationFrame(this.tick);
    }

    stop() { this.running = false; }

    draw(dt, t) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      this.gust *= 0.94;

      for (let i = 0; i < this.leaves.length; i++) {
        const l = this.leaves[i];
        l.y += (l.vy + this.gust * 12) * dt;
        l.x += Math.sin(t * l.swaySpeed + l.phase) * l.sway * dt + 6 * dt; // лёгкий снос вправо
        l.angle += l.spin * dt;

        if (l.y > this.h + 80) Object.assign(l, this.spawn(), { y: rand(-140, -60) });
        if (l.x < -90) l.x = this.w + 80;
        if (l.x > this.w + 90) l.x = -80;

        if (!l.img.complete || !l.img.naturalWidth) continue;
        const squash = Math.cos(t * l.flutter + l.phase); // лист поворачивается плоскостью
        ctx.save();
        ctx.globalAlpha = l.alpha;
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle);
        ctx.scale(Math.max(Math.abs(squash), 0.38) * Math.sign(squash || 1), 1);
        const ratio = l.img.naturalHeight / l.img.naturalWidth;
        ctx.drawImage(l.img, -l.size / 2, (-l.size * ratio) / 2, l.size, l.size * ratio);
        ctx.restore();
      }
    }
  }

  const init = () => {
    const hero = document.querySelector(".hero");
    if (hero) new LeafField(hero, 20);
    const phero = document.querySelector(".phero");
    if (phero) new LeafField(phero, 12);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
