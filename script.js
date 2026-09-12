/* ==================================================================
   Davi Araújo — link na bio
   1. ano do rodapé
   2. linhas fluindo no fundo (mais fracas atrás da foto, cheias abaixo da dobra)
   3. rastro de brilho do cursor (só no desktop)
   ================================================================== */

const REDUZIDO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 1. ano ---------- */
(function ano() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
})();

/* ---------- 2. linhas do fundo ---------- */
(function linhas() {
  const canvas = document.querySelector(".bg__lines");
  if (!canvas || REDUZIDO) return;

  const ctx = canvas.getContext("2d");
  const GAP = 26;   // distância entre as linhas
  const STEP = 16;  // resolução horizontal da curva

  let W = 0, H = 0, cols = 0, fold = 0, lines = [];
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, ativo: false };

  function montar() {
    lines = [];
    const n = Math.ceil(H / GAP) + 2;
    for (let i = 0; i < n; i++) {
      const baseY = i * GAP;
      const v = H ? baseY / H : 0;
      // sob a foto elas quase somem e vão ganhando corpo até emergir na dobra
      const peso = fold > 0 ? 0.15 + 0.85 * Math.min(1, baseY / fold) : 1;
      lines.push({
        baseY,
        fase: i * 0.5,
        amp: (6 + v * 24) * (0.5 + 0.5 * peso),
        // branco rende mais que o ciano no blend aditivo — alfa mais baixa
        alpha: (0.030 + v * 0.085) * peso,
      });
    }
  }

  function medir() {
    W = window.innerWidth;
    H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(W / STEP) + 1;

    const hero = document.querySelector(".hero");
    fold = hero ? hero.getBoundingClientRect().height : 0;

    montar();
  }

  let t = 0;
  const sigma = 190, sig2 = 2 * sigma * sigma, empurrao = 84;

  function frame() {
    t += 0.006;
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 1.1;

    for (const L of lines) {
      ctx.beginPath();
      let px = 0, py = 0;
      for (let c = 0; c <= cols; c++) {
        const x = c * STEP;
        let y = L.baseY
          + L.amp * Math.sin(x * 0.006 + t * 1.2 + L.fase)
          + L.amp * 0.5 * Math.sin(x * 0.013 - t * 0.8 + L.fase * 1.7);

        if (mouse.ativo) {
          const dx = x - mouse.x, dy = L.baseY - mouse.y;
          y -= empurrao * Math.exp(-(dx * dx + dy * dy) / sig2);
        }

        if (c === 0) ctx.moveTo(x, y);
        else ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
        px = x; py = y;
      }

      let a = L.alpha;
      if (mouse.ativo) {
        const dyc = L.baseY - mouse.y;
        a += 0.07 * Math.exp(-(dyc * dyc) / sig2);
      }
      ctx.strokeStyle = "rgba(242, 241, 236, " + a.toFixed(3) + ")";
      ctx.stroke();
    }

    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(frame);
  }

  window.addEventListener("mousemove", (e) => {
    mouse.tx = e.clientX; mouse.ty = e.clientY; mouse.ativo = true;
  }, { passive: true });
  window.addEventListener("resize", medir);

  medir();
  requestAnimationFrame(frame);
})();

/* ---------- 3. rastro do cursor ---------- */
(function rastro() {
  if (REDUZIDO || !window.matchMedia("(pointer: fine)").matches) return;

  const cv = document.createElement("canvas");
  cv.className = "cursorfx";
  cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);

  const ctx = cv.getContext("2d");
  let w = 0, h = 0;

  function medir() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  medir();
  window.addEventListener("resize", medir);

  const TAU = Math.PI * 2, MAX = 80;
  const parts = [];
  let mx = -999, my = -999, hx = -999, hy = -999;
  let iniciou = false, parado = 999, raf = 0;

  function frame() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    hx += (mx - hx) * 0.17;
    hy += (my - hy) * 0.17;

    const halo = Math.max(0, 1 - parado / 40);
    if (halo > 0.01) {
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 92);
      g.addColorStop(0,    "rgba(53, 214, 255, " + 0.20 * halo + ")");
      g.addColorStop(0.55, "rgba(53, 214, 255, " + 0.06 * halo + ")");
      g.addColorStop(1,    "rgba(53, 214, 255, 0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(hx, hy, 92, 0, TAU); ctx.fill();
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.965; p.vy = p.vy * 0.965 + 0.008;
      p.vida -= p.decai;
      if (p.vida <= 0) { parts.splice(i, 1); continue; }

      const a = p.vida * p.vida;
      const r = p.r * (0.55 + p.vida * 0.75) * 4;
      const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      pg.addColorStop(0,    "rgba(120, 224, 255, " + a * 0.85 + ")");
      pg.addColorStop(0.32, "rgba(53, 214, 255, "  + a * 0.48 + ")");
      pg.addColorStop(1,    "rgba(18, 162, 214, 0)");
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
    parado++;
    raf = (parts.length || parado < 45) ? requestAnimationFrame(frame) : 0;
  }

  window.addEventListener("mousemove", (e) => {
    const px = mx, py = my;
    mx = e.clientX; my = e.clientY;
    if (!iniciou) { hx = mx; hy = my; iniciou = true; }

    const dx = mx - px, dy = my - py;
    const vel = Math.min(60, Math.hypot(dx, dy));
    const n = 1 + Math.floor(vel / 24);

    for (let i = 0; i < n && parts.length < MAX; i++) {
      parts.push({
        x: mx + (Math.random() - 0.5) * 9,
        y: my + (Math.random() - 0.5) * 9,
        vx: dx * 0.05 + (Math.random() - 0.5) * 0.55,
        vy: dy * 0.05 + (Math.random() - 0.5) * 0.55 - 0.12,
        r: 0.7 + Math.random() * 1.9,
        vida: 1,
        decai: 0.017 + Math.random() * 0.017,
      });
    }
    parado = 0;
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });

  document.addEventListener("mouseleave", () => { parado = 999; });
})();
