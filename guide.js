// Pitstop · guia de pistas: traçado em estilo telemetria, ficha, provas de 2026, galeria e localização.
// Carregado antes de app.js; as funções usam SERIES, ORDER, raceDate, countdown, $ e esc de app.js na hora em que rodam.
window.Guide = (() => {
  const C = window.CIRCUITS || {}, V = window.VENUES || {};
  const LEAFLET = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/";
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COARSE = matchMedia("(hover: none)").matches;
  const nf = (n, d) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const kmOf = c => (c.length_km ? `${nf(+c.length_km, 3)} km` : null);
  const DIR = { cw: "Horário", ccw: "Anti-horário", eight: "Em oito (cruza a si mesmo)" };
  // na Fórmula E estas provas usam uma versão mais curta do circuito
  const FE_SHORT = { mexico: true, jeddah: true, shanghai: true };

  /* ---------- Provas por circuito ---------- */
  let ALL = null;
  const allRaces = () => ALL ||= ORDER.flatMap(sid => SERIES[sid].calendar.map((r, i) => ({ s: SERIES[sid], r, d: raceDate(r), v: V[sid]?.[i] })))
    .filter(x => x.v && C[x.v]);
  const racesAt = id => allRaces().filter(x => x.v === id).sort((a, b) => a.d - b.d);
  const pending = x => !x.r.winner && !x.s.seasonOver && x.d >= Date.now() - 864e5;
  const accentOf = id => (racesAt(id)[0]?.s.accent) || "#e10600";

  // ordem do guia: primeiro quem ainda vai receber corrida (da mais próxima), depois as já disputadas (da mais recente)
  function venues() {
    return Object.values(C).map(c => {
      const rs = racesAt(c.id), up = rs.find(pending);
      return { c, rs, up, key: up ? up.d.getTime() : 1e15 - (rs.at(-1)?.d.getTime() || 0) };
    }).filter(x => x.rs.length).sort((a, b) => a.key - b.key);
  }

  /* ---------- Geometria ---------- */
  function bbox(p) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of p) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  }
  function fit(p, w, h, pad) {
    const b = bbox(p);
    const s = Math.min((w - 2 * pad) / (b.w || 1), (h - 2 * pad) / (b.h || 1));
    const ox = (w - b.w * s) / 2 - b.x0 * s, oy = (h - b.h * s) / 2 - b.y0 * s;
    return { s, map: ([x, y]) => [ox + x * s, oy + y * s] };
  }
  const perimeter = p => p.reduce((a, q, i) => a + Math.hypot(q[0] - p[(i + 1) % p.length][0], q[1] - p[(i + 1) % p.length][1]), 0);
  // reamostra o anel fechado em passos iguais (em metros)
  function resample(p, n) {
    const L = perimeter(p), step = L / n, out = [];
    let i = 0, acc = 0, a = p[0], b = p[1], seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let k = 0; k < n; k++) {
      const want = k * step;
      while (acc + seg < want && i < p.length) { acc += seg; i++; a = p[i % p.length]; b = p[(i + 1) % p.length]; seg = Math.hypot(b[0] - a[0], b[1] - a[1]); }
      const t = seg ? (want - acc) / seg : 0;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    return { pts: out, step, total: L };
  }

  function outline(c) {
    if (!c.path) return `<svg class="c-outline is-empty" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="30"/><text x="50" y="54" text-anchor="middle">sem traçado</text></svg>`;
    const f = fit(c.path, 100, 100, 8);
    const d = "M" + c.path.map(q => f.map(q).map(v => v.toFixed(1)).join(" ")).join("L") + "Z";
    return `<svg class="c-outline" viewBox="0 0 100 100" aria-hidden="true"><path class="o-base" d="${d}"/><path class="o-run" d="${d}" pathLength="1"/></svg>`;
  }

  /* ======================================================================
     Mapa do traçado: campo de pontos (meio-tom) aceso pela mira do mouse
     e uma volta desenhada que freia nas curvas, como no site do Kimi
     ====================================================================== */
  const rgb = hex => { const n = parseInt(String(hex).replace("#", ""), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const css = ([r, g, b], a = 1) => `rgb(${r} ${g} ${b} / ${a})`;
  const approach = (from, to, dt, tau) => from + (to - from) * (1 - Math.exp(-dt / Math.max(tau, 1e-4)));
  const ease = t => -(Math.cos(Math.PI * t) - 1) / 2;

  function trackMap(box, c, accent, { onDone } = {}) {
    const ht = box.querySelector(".tb-ht"), tr = box.querySelector(".tb-trace");
    const hctx = ht.getContext("2d"), ctx = tr.getContext("2d");
    const ACC = rgb(accent), WHITE = [236, 238, 241], DOT = [58, 63, 73], BRIGHT = mix(ACC, WHITE, 0.55);
    const read = box.querySelector(".tb-read b"), readLabel = box.querySelector(".tb-read small");
    const scaleEl = box.querySelector(".tb-scale");
    const PITCH = 12, DOT_R = 1.05, MAX_DPR = COARSE ? 1.5 : 2;

    // traçado em metros, reamostrado, com a "velocidade" de cada trecho pela curvatura
    let R = null, timeAt = null, marks = [];
    const symmetric = !c.dir;                                        // sem sentido confirmado: desenha dos dois lados
    if (c.path) {
      R = resample(c.path, 1200);
      const n = R.pts.length, turn = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const a = R.pts[(i - 1 + n) % n], b = R.pts[i], d = R.pts[(i + 1) % n];
        const ux = b[0] - a[0], uy = b[1] - a[1], vx = d[0] - b[0], vy = d[1] - b[1];
        turn[i] = Math.abs(Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)) / R.step;   // rad por metro
      }
      const win = Math.max(2, Math.round(35 / R.step));
      const curv = Array.from(turn, (_, i) => { let s = 0; for (let j = -win; j <= win; j++) s += turn[(i + j + n) % n]; return s / (2 * win + 1); });
      const acc = [0];
      for (let i = 1; i <= n; i++) acc.push(acc[i - 1] + R.step / Math.max(0.16, 1 / (1 + 60 * curv[i % n])));
      timeAt = acc.map(v => v / acc[n]);
      // pontos de frenagem forte: picos de curvatura bem separados
      const sep = Math.round(160 / R.step);
      for (let i = 0; i < n; i++) {
        if (curv[i] < 0.011) continue;
        let peak = true;
        for (let j = -sep; j <= sep && peak; j++) if (j && curv[(i + j + n) % n] > curv[i]) peak = false;
        if (peak) marks.push(i);
      }
    }

    let W = 0, H = 0, dpr = 1, S = null, F = null;
    let cols = 0, rows = 0, ox = 0, oy = 0, imprint = null, level = null, baked = null;
    const active = []; const inList = new Set();

    function layout() {
      const r = box.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
      for (const cv of [ht, tr]) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const pad = Math.max(28, Math.min(W, H) * 0.09);
      if (R) {
        F = fit(R.pts, W, H, pad);
        S = R.pts.map(F.map);
        scale(F.s);
      }
      // grade de pontos e a "marca" que o traçado deixa nela
      cols = Math.floor(W / PITCH); rows = Math.floor(H / PITCH);
      ox = (W - (cols - 1) * PITCH) / 2; oy = (H - (rows - 1) * PITCH) / 2;
      imprint = new Float32Array(cols * rows); level = new Float32Array(cols * rows);
      active.length = 0; inList.clear();
      if (S) {
        const reach = 20;
        for (let k = 0; k < S.length; k += 2) {
          const [x, y] = S[k];
          const i0 = Math.max(0, Math.floor((x - reach - ox) / PITCH)), i1 = Math.min(cols - 1, Math.ceil((x + reach - ox) / PITCH));
          const j0 = Math.max(0, Math.floor((y - reach - oy) / PITCH)), j1 = Math.min(rows - 1, Math.ceil((y + reach - oy) / PITCH));
          for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
            const d = Math.hypot(ox + i * PITCH - x, oy + j * PITCH - y);
            const v = 1 - d / reach;
            if (v > imprint[j * cols + i]) imprint[j * cols + i] = v;
          }
        }
      }
      bake();
      draw(true);
      renderTrace();
    }

    function scale(s) {
      if (!scaleEl) return;
      const nice = [25, 50, 100, 200, 250, 500, 1000, 2000];
      const m = nice.find(v => v * s >= 56) || 2000;
      scaleEl.style.setProperty("--w", `${(m * s).toFixed(1)}px`);
      scaleEl.querySelector("span").textContent = m >= 1000 ? `${m / 1000} km` : `${m} m`;
    }

    function bake() {
      baked = baked || document.createElement("canvas");
      baked.width = ht.width; baked.height = ht.height;
      const b = baked.getContext("2d");
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.clearRect(0, 0, W, H);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const v = imprint[j * cols + i];
        b.fillStyle = v > 0 ? css(mix(DOT, ACC, 0.18 + 0.4 * v), 0.95) : css(DOT, 0.75);
        b.beginPath(); b.arc(ox + i * PITCH, oy + j * PITCH, v > 0 ? DOT_R + 0.5 * v : DOT_R, 0, Math.PI * 2); b.fill();
      }
    }

    // mira: braços na linha e na coluna do ponteiro + núcleo; os pontos acesos viram quadrados
    const pointer = { x: 0, y: 0, heat: 0 }, target = { x: 0, y: 0, on: false };
    let spread = 0, armed = !R || REDUCE, last = 0;
    const add = (idx, v) => {
      if (v <= 0.02) return;
      if (v > level[idx]) level[idx] = v;
      if (!inList.has(idx)) { inList.add(idx); active.push(idx); }
    };
    function reticle() {
      if (pointer.heat <= 0.01) return;
      const ci = Math.round((pointer.x - ox) / PITCH), cj = Math.round((pointer.y - oy) / PITCH);
      const reach = 260 * spread, arm = 0.82 * pointer.heat;
      if (reach > 1 && cj >= 0 && cj < rows) {
        const sp = Math.ceil(reach / PITCH);
        for (let i = Math.max(0, ci - sp); i <= Math.min(cols - 1, ci + sp); i++) add(cj * cols + i, (1 - Math.abs(ox + i * PITCH - pointer.x) / reach) * arm);
      }
      if (reach > 1 && ci >= 0 && ci < cols) {
        const sp = Math.ceil(reach / PITCH);
        for (let j = Math.max(0, cj - sp); j <= Math.min(rows - 1, cj + sp); j++) add(j * cols + ci, (1 - Math.abs(oy + j * PITCH - pointer.y) / reach) * arm);
      }
      const core = 46, s = Math.ceil(core / PITCH);
      for (let j = Math.max(0, cj - s); j <= Math.min(rows - 1, cj + s); j++) for (let i = Math.max(0, ci - s); i <= Math.min(cols - 1, ci + s); i++) {
        const d = Math.hypot(ox + i * PITCH - pointer.x, oy + j * PITCH - pointer.y) / core;
        if (d < 1) add(j * cols + i, (1 - d) * (1 - d) * pointer.heat);
      }
    }
    function draw(force) {
      if (!baked) return;
      if (!force && !active.length) return;
      hctx.setTransform(1, 0, 0, 1, 0, 0);
      hctx.clearRect(0, 0, ht.width, ht.height);
      hctx.drawImage(baked, 0, 0);
      hctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const th = 0.3, box2 = DOT_R * 2 + 2;
      for (const idx of active) {
        const v = level[idx];
        if (v < th) continue;
        const i = idx % cols, j = (idx / cols) | 0, x = ox + i * PITCH, y = oy + j * PITCH;
        hctx.clearRect(x - box2 / 2, y - box2 / 2, box2, box2);
        if ((i + j) & 1) continue;
        const t = Math.min(1, (v - th) / (1 - th)), side = PITCH * (0.55 + 0.4 * t);
        hctx.fillStyle = css(v > 0.8 ? WHITE : v > 0.5 ? BRIGHT : mix(ACC, BRIGHT, v));
        hctx.fillRect(x - side / 2, y - side / 2, side, side);
      }
    }
    function htFrame(now) {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      const wanted = target.on && armed ? 0.95 : 0;
      if (pointer.heat <= 0.001 && wanted > 0) { pointer.x = target.x; pointer.y = target.y; }
      else if (dt > 0) {
        const px = pointer.x, py = pointer.y;
        pointer.x = approach(px, target.x, dt, 0.07); pointer.y = approach(py, target.y, dt, 0.07);
        const speed = Math.hypot(pointer.x - px, pointer.y - py) / dt;
        const want = Math.max(0, 1 - speed / 900);
        spread = approach(spread, want, dt, want > spread ? 0.38 : 0.09);
      }
      pointer.heat = approach(pointer.heat, wanted, dt, wanted > pointer.heat ? 0.14 : 0.3);
      if (pointer.heat < 0.005) { pointer.heat = 0; spread = 0; }
      const decay = Math.exp(-dt / 0.3);
      const before = active.length;
      let w = 0;
      for (let k = 0; k < active.length; k++) {
        const idx = active[k], v = level[idx] * decay;
        if (v > 0.02) { level[idx] = v; active[w++] = idx; } else { level[idx] = 0; inList.delete(idx); }
      }
      active.length = w;
      reticle();
      if (active.length || before) draw(true);
    }
    if (!COARSE && !REDUCE) {
      box.addEventListener("pointermove", e => {
        if (e.pointerType !== "mouse") return;
        const r = box.getBoundingClientRect();
        target.x = e.clientX - r.left; target.y = e.clientY - r.top; target.on = true; wake();
      });
      box.addEventListener("pointerleave", () => { target.on = false; });
    }

    /* ---------- a volta ---------- */
    const LAP_MS = 7000, COOL_MS = 900;
    let lap = REDUCE ? 1 : 0, heat = REDUCE ? 0 : 1, t0 = 0, phase = REDUCE ? "done" : "idle";
    const n = R ? R.pts.length : 0;
    const distAt = t => {                       // índice fracionário no traçado para o tempo t (0..1)
      if (t <= 0) return 0; if (t >= 1) return n;
      let lo = 0, hi = n;
      while (lo < hi - 1) { const m = (lo + hi) >> 1; if (timeAt[m] <= t) lo = m; else hi = m; }
      return lo + (t - timeAt[lo]) / ((timeAt[hi] - timeAt[lo]) || 1);
    };
    const at = f => { const i = Math.floor(f) % n, k = f - Math.floor(f), a = S[i], b = S[(i + 1) % n]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; };
    const slice = (from, to) => {               // pontos de "from" a "to" (índices fracionários, to pode passar de n)
      const out = [at(from)];
      for (let i = Math.ceil(from); i < to; i++) out.push(S[i % n]);
      out.push(at(to));
      return out;
    };
    const sliceBack = (len) => {                // de 0 andando para trás "len" pontos
      const out = [S[0]];
      for (let i = 1; i < len; i++) out.push(S[(n - i) % n]);
      out.push(at((n - len % n) % n));
      return out;
    };
    function line(p) { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]); ctx.stroke(); }
    const LW = () => Math.max(3.5, Math.min(W, H) / 120);
    function trail(p) {
      if (p.length < 2) return;
      const lw = LW();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = css(ACC, 0.07); ctx.lineWidth = lw * 4.5; line(p);
      ctx.strokeStyle = css(ACC, 0.14); ctx.lineWidth = lw * 2.2; line(p);
      ctx.restore();
      ctx.strokeStyle = css(ACC, 1); ctx.lineWidth = lw; line(p);
      if (heat <= 0.01) return;
      const head = Math.min(p.length - 1, 70), from = p.length - 1 - head, tip = p.at(-1);
      const g = ctx.createLinearGradient(p[from][0], p[from][1], tip[0], tip[1]);
      g.addColorStop(0, css(BRIGHT, 0)); g.addColorStop(1, css(WHITE, 0.95 * heat));
      ctx.strokeStyle = g; ctx.lineWidth = lw * 0.55; line(p.slice(from));
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const sp = ctx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], lw * 3.2);
      sp.addColorStop(0, css(WHITE, 0.9 * heat)); sp.addColorStop(0.35, css(BRIGHT, 0.45 * heat)); sp.addColorStop(1, css(ACC, 0));
      ctx.fillStyle = sp; ctx.beginPath(); ctx.arc(tip[0], tip[1], lw * 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    function chevrons(alpha) {
      if (!c.dir || c.dir === "eight" || alpha <= 0) return;
      const lw = LW();
      ctx.fillStyle = css(WHITE, 0.85 * alpha);
      for (let k = 0; k < 6; k++) {
        const i = Math.floor((k + 0.5) * n / 6), a = S[i], b = S[(i + 4) % n];
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        ctx.save(); ctx.translate(a[0], a[1]); ctx.rotate(ang);
        const s = lw * 1.25;
        ctx.beginPath(); ctx.moveTo(s * 1.4, 0); ctx.lineTo(-s, -s * 1.1); ctx.lineTo(-s * 0.3, 0); ctx.lineTo(-s, s * 1.1); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    function renderTrace() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!S) return;
      const lw = LW();
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = css(WHITE, 0.16); ctx.lineWidth = lw * 1.9; line([...S, S[0]]);
      ctx.strokeStyle = css(WHITE, 0.5); ctx.lineWidth = 1; line([...S, S[0]]);
      const e = ease(Math.min(1, lap));
      let driven, frac;
      if (symmetric) {
        const half = e * n / 2;
        frac = e;
        if (half > 0.01) { trail(slice(0, half)); trail(sliceBack(half)); }
        driven = i => i <= half || i >= n - half;
      } else {
        const d = distAt(e);
        frac = d / n;
        if (d > 0.01) trail(slice(0, d));
        driven = i => i <= d;
      }
      // frenagens: acendem quando a volta passa por elas
      for (const i of marks) {
        if (!driven(i)) continue;
        const [x, y] = S[i];
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(x, y, 0, x, y, lw * 3.4);
        g.addColorStop(0, css(BRIGHT, 0.75)); g.addColorStop(0.45, css(ACC, 0.3)); g.addColorStop(1, css(ACC, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, lw * 3.4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.fillStyle = css(WHITE, 0.9); ctx.fillRect(x - 2, y - 2, 4, 4);
      }
      chevrons(phase === "done" || phase === "cool" ? 1 - heat : 0);
      if (read) {
        const L = c.length_km ? +c.length_km : R.total / 1000;
        read.textContent = `${nf(L * frac, 3)} km`;
        readLabel.textContent = frac >= 1 ? "Volta completa" : phase === "idle" ? "Pronto para a volta" : "Volta de reconhecimento";
      }
    }

    /* ---------- laço de animação: só roda quando há algo mudando e o mapa está na tela ---------- */
    let raf = 0, visible = false, hiddenAt = 0;
    function tick(now) {
      raf = 0;
      if (phase === "lap") {
        lap = Math.min(1, (now - t0) / LAP_MS);
        if (lap >= 1) { phase = "cool"; t0 = now; }
        renderTrace();
      } else if (phase === "cool") {
        const k = Math.min(1, (now - t0) / COOL_MS);
        heat = 1 - (1 - Math.pow(1 - k, 3));
        if (k >= 1) { phase = "done"; heat = 0; armed = true; onDone?.(); }
        renderTrace();
      }
      htFrame(now);
      const busy = phase === "lap" || phase === "cool" || active.length || pointer.heat > 0 || target.on;
      if (busy && visible && !document.hidden) raf = requestAnimationFrame(tick); else last = 0;
    }
    // se a aba ficou escondida no meio da volta, a volta continua de onde parou
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { hiddenAt = performance.now(); return; }
      if (hiddenAt && (phase === "lap" || phase === "cool")) t0 += performance.now() - hiddenAt;
      hiddenAt = 0; wake();
    });
    function wake() { if (!raf && visible) raf = requestAnimationFrame(tick); }
    function start() {
      if (!R || REDUCE) return;
      lap = 0; heat = 1; armed = false; phase = "lap"; t0 = performance.now(); wake();
    }
    new ResizeObserver(layout).observe(box);
    let started = false;
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !started && phase === "idle") { started = true; start(); }
      if (visible) wake();
    }, { threshold: 0.3 }).observe(box);
    return { replay: start };
  }

  function trackBox(c, { big = false, label = true } = {}) {
    return `
      <div class="track-box${big ? " is-big" : ""}${c.path ? "" : " no-path"}">
        <canvas class="tb-ht" aria-hidden="true"></canvas>
        <canvas class="tb-trace" role="img" aria-label="Traçado de ${esc(c.name)}${c.dir ? `, sentido ${DIR[c.dir].toLowerCase()}` : ""}"></canvas>
        <span class="tb-north" aria-hidden="true"><svg viewBox="0 0 20 28"><path d="M10 2 17 24 10 19 3 24Z"/></svg>N</span>
        ${c.path ? `
        <span class="tb-scale" aria-hidden="true"><i></i><span></span></span>
        ${label ? `<span class="tb-read"><small>Pronto para a volta</small><b>0,000 km</b></span>` : ""}
        <button class="tb-replay" type="button"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10a6 6 0 1 0 2-4.5M4 3v3.5h3.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>Dar outra volta</button>`
        : `<p class="tb-empty"><b>Traçado sem fonte aberta</b>Não há um desenho do circuito com licença livre. Veja o local no mapa de satélite.</p>`}
      </div>`;
  }
  function mountTrack(host, c, accent) {
    const box = host.querySelector(".track-box");
    const tm = trackMap(box, c, accent);
    box.querySelector(".tb-replay")?.addEventListener("click", () => tm.replay());
    return tm;
  }

  /* ======================================================================
     Leaflet (só carrega quando um mapa vai aparecer)
     ====================================================================== */
  let leafletP = null;
  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    return leafletP ||= new Promise((res, rej) => {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = LEAFLET + "leaflet.min.css";
      document.head.append(l);
      const s = document.createElement("script");
      s.src = LEAFLET + "leaflet.min.js"; s.onload = res; s.onerror = rej;
      document.head.append(s);
    });
  }
  const TILES = {
    dark: ["https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 16, attribution: 'Mapa &copy; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }],
    sat: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19, attribution: "Imagens &copy; Esri, Maxar, Earthstar Geographics" }],
  };
  function whenNear(el, fn) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); fn(); } }, { rootMargin: "400px 0px" });
    io.observe(el);
  }
  const mapOpts = () => ({ scrollWheelZoom: false, worldCopyJump: true, zoomSnap: 0.25, dragging: !COARSE, tap: false, attributionControl: true });
  // traçado (metros em volta do centro) → latitude/longitude
  const toLatLng = c => c.path.map(([x, y]) => [c.center[0] - y / 110540, c.center[1] + x / (111320 * Math.cos(c.center[0] * Math.PI / 180))]);

  /* ======================================================================
     ÍNDICE: ?c=pistas
     ====================================================================== */
  function renderIndex(main) {
    document.title = "Pitstop: guia de pistas";
    const list = venues();
    const next = list.find(x => x.up && x.c.path) || list[0];
    const countries = new Set(list.map(x => x.c.country)).size;
    const totalKm = list.reduce((a, x) => a + (+x.c.length_km || 0), 0);
    const races = allRaces().length;
    const nc = next.c, nacc = next.up?.s.accent || accentOf(nc.id);

    main.innerHTML = `
      <section class="g-hero" id="tracado" style="--c:${nacc}">
        <div class="g-copy">
          <p class="kicker">Guia de pistas · 2026</p>
          <h1 class="g-title">Pistas</h1>
          <p class="g-lede">Os ${list.length} circuitos dos ${ORDER.length} campeonatos: traçado, extensão, curvas, recorde da volta, as provas do ano, fotos e onde ficam.</p>
          <dl class="lobby-stats g-stats">
            <div><dt>Circuitos</dt><dd>${list.length}</dd></div>
            <div><dt>Países</dt><dd>${countries}</dd></div>
            <div><dt>Provas em 2026</dt><dd>${races}</dd></div>
            <div><dt>Km de pista somados</dt><dd>${Math.round(totalKm)}</dd></div>
          </dl>
        </div>
        <a class="g-feature" href="?pista=${nc.id}">
          <span class="g-feature-tag">${next.up ? `Próxima prova · ${esc(next.up.s.short)} · ${esc(next.up.r.date)}` : "Em destaque"}</span>
          ${trackBox(nc)}
          <span class="g-feature-name"><b>${esc(nc.name)}</b><small>${esc(nc.city)}, ${esc(nc.country)} · ${kmOf(nc) || ""}</small><em>Abrir guia ›</em></span>
        </a>
      </section>

      <section class="g-world" id="mundo" aria-labelledby="world-title">
        <div class="section-head"><h2 id="world-title">Onde ficam</h2><p>Cada ponto é um circuito, na cor do campeonato que corre lá. Clique para abrir o guia da pista.</p></div>
        <div class="world-map" id="worldMap" role="region" aria-label="Mapa-múndi dos circuitos"><p class="map-loading">Carregando mapa…</p></div>
      </section>

      <section class="g-list" id="circuitos" aria-labelledby="list-title">
        <div class="section-head"><h2 id="list-title">Circuitos</h2><p>Em ordem de calendário: primeiro as próximas provas, depois as já disputadas.</p></div>
        <div class="g-filters" role="group" aria-label="Filtrar por campeonato">
          <button aria-pressed="true" data-s="all">Todos <small>${list.length}</small></button>
          ${ORDER.map(id => `<button aria-pressed="false" data-s="${id}" style="--c:${SERIES[id].accent}"><i></i>${esc(SERIES[id].short)} <small>${new Set(V[id]).size}</small></button>`).join("")}
        </div>
        <div class="c-grid" id="cGrid">${list.map(card).join("")}</div>
      </section>`;

    mountTrack($(".g-feature", main), nc, nacc);
    $(".g-filters", main).addEventListener("click", e => {
      const b = e.target.closest("[data-s]");
      if (!b) return;
      main.querySelectorAll(".g-filters button").forEach(x => x.setAttribute("aria-pressed", x === b));
      const s = b.dataset.s;
      main.querySelectorAll(".c-card").forEach(el => { el.hidden = s !== "all" && !el.dataset.series.split(" ").includes(s); });
      worldFilter?.(s);
    });

    let worldFilter = null;
    whenNear($("#worldMap"), async () => {
      try { await loadLeaflet(); } catch (e) { $("#worldMap").innerHTML = `<p class="map-loading">Não foi possível carregar o mapa.</p>`; return; }
      const el = $("#worldMap"); el.innerHTML = "";
      const map = L.map(el, { ...mapOpts(), minZoom: 1.5 }).setView([22, 12], COARSE ? 1.5 : 2);
      L.tileLayer(...TILES.dark).addTo(map);
      const layers = [];
      list.forEach(({ c, rs, up }) => {
        if (c.lat == null) return;
        const ser = [...new Set(rs.map(x => x.s.id))];
        const g = L.layerGroup(ser.map((sid, k) => L.circleMarker([c.lat, c.lon], {
          radius: 5 + k * 3.5, color: SERIES[sid].accent, weight: k ? 2 : 1.5, fillColor: SERIES[sid].accent, fillOpacity: k ? 0 : 0.95, opacity: 1,
        })).reverse());
        g.eachLayer(m => {
          m.bindTooltip(`<b>${esc(c.name)}</b><br>${esc(c.country)} · ${ser.map(s => esc(SERIES[s].short)).join(", ")}${up ? `<br>Próxima: ${esc(up.r.date)}` : ""}`, { direction: "top", offset: [0, -6], className: "pit-tip" });
          m.on("click", () => { location.href = `?pista=${c.id}`; });
        });
        g.addTo(map);
        layers.push({ g, ser });
      });
      worldFilter = s => layers.forEach(({ g, ser }) => { const on = s === "all" || ser.includes(s); on ? g.addTo(map) : g.remove(); });
      const cur = main.querySelector(".g-filters [aria-pressed=true]")?.dataset.s;
      if (cur && cur !== "all") worldFilter(cur);
    });
    return [["tracado", "Destaque"], ["mundo", "Mapa"], ["circuitos", "Circuitos"]];
  }

  function card({ c, rs, up }) {
    const ser = [...new Set(rs.map(x => x.s.id))];
    const acc = (up || rs[0]).s.accent;
    return `
      <a class="c-card" href="?pista=${c.id}" data-series="${ser.join(" ")}" style="--c:${acc}">
        <span class="c-art">${outline(c)}${up ? `<span class="c-next">Próxima · ${esc(up.r.date)}</span>` : ""}</span>
        <span class="c-body">
          <b class="c-name">${esc(c.name)}</b>
          <small class="c-place">${esc(c.city)}, ${esc(c.country)}</small>
          <span class="c-facts">${kmOf(c) ? `<span><em>Extensão</em>${kmOf(c)}</span>` : ""}${c.turns ? `<span><em>Curvas</em>${esc(c.turns)}</span>` : ""}${c.dir ? `<span><em>Sentido</em>${c.dir === "eight" ? "Em oito" : DIR[c.dir]}</span>` : ""}</span>
          <span class="c-series">${ser.map(s => `<i style="--c:${SERIES[s].accent}">${esc(SERIES[s].short)}</i>`).join("")}</span>
        </span>
      </a>`;
  }

  /* ======================================================================
     CIRCUITO: ?pista=<id>
     ====================================================================== */
  function renderCircuit(main, c) {
    document.title = `Pitstop: ${c.name}`;
    const list = venues(), k = list.findIndex(x => x.c.id === c.id);
    const rs = racesAt(c.id), up = rs.find(pending), acc = (up || rs[0])?.s.accent || "#e10600";
    const prev = list[(k - 1 + list.length) % list.length].c, next = list[(k + 1) % list.length].c;
    const measured = c.path ? perimeter(c.path) / 1000 : null;
    const coord = (v, pos, neg) => `${nf(Math.abs(v), 4)}° ${v >= 0 ? pos : neg}`;
    const hasFE = rs.some(x => x.s.id === "formulae");
    const notes = [
      hasFE && FE_SHORT[c.id] && "Na Fórmula E a prova usa uma versão mais curta do circuito; o desenho e a ficha mostram o traçado completo.",
      c.id === "homestead" && "A Fórmula E corre num traçado montado na área interna do oval; a ficha do oval não vale para ele.",
      c.id === "lemans" && "A volta de 13,6 km usa estradas públicas fechadas para a corrida, por isso não há traçado aberto contínuo.",
      c.dir === "eight" && "Suzuka é um oito: o traçado passa por cima de si mesmo num viaduto.",
    ].filter(Boolean);
    const photos = (c.photos || []).map(p => ({ t: "p", ...p }));

    main.innerHTML = `
      <section class="ct-hero" id="tracado" style="--c:${acc}">
        <div class="ct-copy">
          <a class="ct-back" href="?c=pistas">‹ Todas as pistas</a>
          <p class="kicker">${esc(c.city)}, ${esc(c.country)}</p>
          <h1 class="ct-name" style="--n:${Math.max(6, ...c.name.split(/[\s-]+/).map(w => w.length + 1))}">${esc(c.name)}</h1>
          ${c.full && c.full !== c.name ? `<p class="ct-full">${esc(c.full)}</p>` : ""}
          <dl class="ct-stats">
            <div><dt>Extensão</dt><dd>${c.length_km ? `${nf(+c.length_km, 3)}<small>km</small>` : "—"}</dd></div>
            <div><dt>Curvas</dt><dd>${esc(c.turns || "—")}</dd></div>
            <div><dt>Sentido</dt><dd class="sm">${c.dir ? (c.dir === "eight" ? "Em oito" : DIR[c.dir]) : "—"}</dd></div>
          </dl>
          ${c.record ? `<p class="ct-record"><span>Recorde da volta</span><b>${esc(c.record.time)}</b>${esc(c.record.driver)}${c.record.cls ? ` · ${esc(c.record.cls)}` : ""}${c.record.year ? ` · ${esc(c.record.year)}` : ""}</p>` : ""}
          ${up ? `<p class="ct-next" style="--c:${up.s.accent}"><i></i><span>Próxima prova: <b>${esc(up.s.short)} · ${esc(up.r.pill || up.r.gp)}</b>, ${esc(up.r.date)}</span><em>${countdown(up.d)}</em></p>` : ""}
        </div>
        <div class="ct-map">
          ${trackBox(c, { big: true })}
          <p class="tb-legend">${c.path ? `${c.dir && c.dir !== "eight" ? "Setas: sentido da corrida. " : c.dir ? "" : "Sentido não confirmado: a volta é desenhada dos dois lados. "}Pontos claros: frenagens fortes, estimadas pela curvatura do traçado. Norte para cima.` : ""}</p>
        </div>
      </section>

      <section class="ct-info" id="ficha" aria-labelledby="ficha-title">
        <div class="section-head"><h2 id="ficha-title">Ficha e provas</h2>${notes.length ? `<p>${notes.map(esc).join(" ")}</p>` : ""}</div>
        <div class="ct-grid">
          <div class="panel">
            <h4>Ficha do circuito</h4>
            <dl class="ct-sheet">
              ${[
                c.full && ["Nome", c.full],
                ["Local", `${c.city}, ${c.country}`],
                ["Extensão oficial", kmOf(c) || "—"],
                ["Curvas", c.turns || "—"],
                ["Sentido", c.dir ? DIR[c.dir] : "Não confirmado"],
                c.record && ["Recorde da volta", `${c.record.time}, ${c.record.driver}${c.record.cls ? ` (${c.record.cls}` : ""}${c.record.year ? `${c.record.cls ? ", " : " ("}${c.record.year})` : c.record.cls ? ")" : ""}`],
                measured && ["Traçado medido no mapa", `${nf(measured, 2)} km`],
                c.lat != null && ["Coordenadas", `${coord(c.lat, "N", "S")}, ${coord(c.lon, "L", "O")}`],
              ].filter(Boolean).map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("")}
            </dl>
            <p class="panel-sub ct-src">O recorde é a melhor volta em corrida de qualquer categoria, segundo a Wikipedia.${c.pathSource ? ` Traçado: ${esc(c.pathSource)}.` : ""}${c.wiki ? ` <a href="${c.wiki}" target="_blank" rel="noopener">Wikipedia ↗</a>` : ""}</p>
          </div>
          <div class="panel">
            <h4>Provas em 2026</h4>
            <p class="panel-sub">${rs.length} ${rs.length > 1 ? "provas" : "prova"} neste circuito.</p>
            <ol class="race-list">${rs.map(x => raceRow(x, x === up)).join("")}</ol>
          </div>
        </div>
      </section>

      ${photos.length ? `
      <section class="ct-gallery" id="galeria" aria-labelledby="gal-title">
        <div class="section-head"><h2 id="gal-title">Galeria</h2><p>Fotos reais da Wikimedia Commons, com autor e licença. Clique para ampliar.</p></div>
        <div class="ph-grid n${Math.min(photos.length, 4)}">${photos.map((p, i) => `
          <button class="ph-tile" data-i="${i}">
            <img src="${p.thumb}" alt="${esc(p.title)}" loading="lazy">
            <span><b>${esc(p.title)}</b><small>${esc(p.credit)}</small></span>
          </button>`).join("")}
        </div>
      </section>` : ""}

      <section class="ct-local" id="local" aria-labelledby="local-title">
        <div class="section-head"><h2 id="local-title">Onde fica</h2><p>${esc(c.city)}, ${esc(c.country)}.${c.center ? " O traçado aparece desenhado sobre a imagem de satélite." : ""}</p></div>
        <div class="local-wrap">
          <div class="local-map" id="localMap" role="region" aria-label="Mapa de ${esc(c.name)}"><p class="map-loading">Carregando mapa…</p></div>
          <div class="local-side">
            <div class="map-switch" role="group" aria-label="Tipo de mapa">
              <button aria-pressed="true" data-l="sat">Satélite</button><button aria-pressed="false" data-l="dark">Mapa</button>
            </div>
            <a class="btn btn-ghost" href="https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lon}" target="_blank" rel="noopener">Abrir no Google Maps ↗</a>
            <a class="btn btn-ghost" href="https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lon}#map=15/${c.lat}/${c.lon}" target="_blank" rel="noopener">Abrir no OpenStreetMap ↗</a>
            <button class="btn btn-ghost" type="button" id="zoomOut">Ver a região</button>
          </div>
        </div>
      </section>

      <nav class="ct-pager" aria-label="Outros circuitos">
        <a href="?pista=${prev.id}"><small>‹ Anterior</small><b>${esc(prev.name)}</b></a>
        <a href="?c=pistas" class="mid">Todas as pistas</a>
        <a href="?pista=${next.id}"><small>Próxima ›</small><b>${esc(next.name)}</b></a>
      </nav>`;

    mountTrack($(".ct-map", main), c, acc);
    main.querySelector(".ph-grid")?.addEventListener("click", e => {
      const b = e.target.closest("[data-i]");
      if (b) window.openGallery?.(photos, +b.dataset.i);
    });

    whenNear($("#localMap"), async () => {
      try { await loadLeaflet(); } catch (e) { $("#localMap").innerHTML = `<p class="map-loading">Não foi possível carregar o mapa.</p>`; return; }
      const el = $("#localMap"); el.innerHTML = "";
      const map = L.map(el, mapOpts());
      const layers = { sat: L.tileLayer(...TILES.sat), dark: L.tileLayer(...TILES.dark) };
      layers.sat.addTo(map);
      let focus;
      if (c.path && c.center) {
        const ll = toLatLng(c);
        L.polygon(ll, { color: "#0b0d10", weight: 7, opacity: 0.55, fill: false }).addTo(map);
        const poly = L.polygon(ll, { color: acc, weight: 3.5, opacity: 1, fill: false }).addTo(map);
        focus = () => map.fitBounds(poly.getBounds(), { padding: [28, 28] });
      } else {
        L.circleMarker([c.lat, c.lon], { radius: 9, color: "#fff", weight: 2, fillColor: acc, fillOpacity: 1 }).addTo(map);
        focus = () => map.setView([c.lat, c.lon], c.id === "lemans" ? 13 : 15);
      }
      focus();
      document.querySelectorAll(".map-switch button").forEach(b => b.addEventListener("click", () => {
        document.querySelectorAll(".map-switch button").forEach(x => x.setAttribute("aria-pressed", x === b));
        Object.entries(layers).forEach(([k, l]) => (k === b.dataset.l ? l.addTo(map) : l.remove()));
      }));
      const zb = $("#zoomOut");
      let wide = false;
      zb.addEventListener("click", () => {
        wide = !wide;
        if (wide) map.setView([c.lat, c.lon], 6); else focus();
        zb.textContent = wide ? "Voltar ao circuito" : "Ver a região";
      });
    });
    return [["tracado", "Traçado"], ["ficha", "Ficha e provas"], photos.length && ["galeria", "Galeria"], ["local", "Onde fica"]].filter(Boolean);
  }

  function raceRow({ s, r, d }, isNext) {
    const team = s.teams.find(t => t.id === r.team);
    const res = r.winner ? `<b>${esc(r.winner)}</b><small>Vencedor${team ? ` · ${esc(team.name)}` : ""}</small>${window.HL?.has(s.id, r.r) ? `<em class="rl-hl">▶ Ver destaques</em>` : ""}`
      : isNext ? `<b class="nx">Próxima</b><small>em ${countdown(d)}</small>` : `<small>A disputar</small>`;
    return `
      <li style="--c:${s.accent}">
        <time datetime="${d.toISOString().slice(0, 10)}"><b>${d.getDate()}</b>${esc(String(r.date).replace(/^\d+\s*/, ""))}</time>
        <span class="rl-gp"><i>${esc(s.short)} · Etapa ${esc(r.r)}</i><b>${esc(r.gp)}</b></span>
        <span class="rl-res">${res}</span>
        <a href="${r.winner && window.HL?.has(s.id, r.r) ? `?c=${s.id}&r=${r.r}#destaques` : `?c=${s.id}#temporada`}" aria-label="${r.winner && window.HL?.has(s.id, r.r) ? `Destaques da etapa: ${esc(r.gp)}` : `Calendário de ${esc(s.name)}`}"></a>
      </li>`;
  }

  /* ---------- Entrada ---------- */
  function render() {
    const p = new URLSearchParams(location.search);
    const id = p.get("pista"), c = id && C[id];
    const main = $("#guide");
    main.hidden = false;
    const nav = c ? renderCircuit(main, c) : renderIndex(main);
    $("#subbar").hidden = false;
    $("#subbar").style.setProperty("--series", c ? accentOf(c.id) : "#ffc21a");
    $("#crumb").innerHTML = c
      ? `<a href="?c=pistas">Pistas</a><span aria-hidden="true">/</span><b>${esc(c.name)}</b><small>${esc(c.country)}</small>`
      : `<a href="./">Início</a><span aria-hidden="true">/</span><b>Guia de pistas</b><small>2026</small>`;
    $("#sectionNav").innerHTML = nav.map(([h, l]) => `<a href="#${h}">${esc(l)}</a>`).join("");
    document.documentElement.style.setProperty("--series", c ? accentOf(c.id) : "#ffc21a");
    $("#footerText").innerHTML = `Pitstop é um projeto de fã, sem vínculo com os campeonatos. Traçados: bacinger/f1-circuits (MIT) e © colaboradores do OpenStreetMap (ODbL). Fichas: Wikipedia. Fotos: Wikimedia Commons, com autor e licença em cada imagem. Mapas e imagens de satélite: © Esri e © OpenStreetMap.`;
  }

  const isRoute = () => { const p = new URLSearchParams(location.search); return p.get("c") === "pistas" || (p.has("pista") && !!C[p.get("pista")]); };
  return { render, isRoute, outline, venues, racesAt, accentOf, kmOf };
})();
