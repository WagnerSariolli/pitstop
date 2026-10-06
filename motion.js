// Pitstop · camada de movimento: rolagem suave, fundos vivos, entradas e transições.
// Tudo aqui é decorativo: sem este arquivo (ou com "reduzir movimento") o site funciona igual, só estático.
import Lenis from "https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.mjs";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(pointer: fine)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const root = document.documentElement;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ======================================================================
   Rolagem suave (Lenis)
   ====================================================================== */
let lenis = null;
if (!reduce) {
  lenis = new Lenis({
    lerp: 0.11,
    anchors: { offset: -124 },
    prevent: node => !!node.closest?.("dialog, .gallery-strip, .team-picker, .section-nav, .cat-panel, .series-nav, .leaflet-container"),
  });
  const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  // janelas (modais) travam a rolagem da página enquanto abertas
  new MutationObserver(() => {
    $$("dialog").some(d => d.open) ? lenis.stop() : lenis.start();
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
}

/* ======================================================================
   Ruído e linhas de contorno (marching squares)
   ====================================================================== */
function makeNoise(seed = 7) {
  const p = new Uint8Array(512);
  const base = Array.from({ length: 256 }, (_, i) => i);
  let s = seed;
  for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [base[i], base[j]] = [base[j], base[i]]; }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  const h = (x, y, z) => p[(p[(p[x & 255] + y) & 255] + z) & 255] / 255;
  const sm = t => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  return (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
    const c = (dx, dy, dz) => h(xi + dx, yi + dy, zi + dz);
    return lerp(
      lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
      lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf), zf);
  };
}
const noise = makeNoise(11);

// pontos de cruzamento por caso (bordas: 0=topo, 1=direita, 2=base, 3=esquerda)
const CASES = [[], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[3, 0], [2, 1]], [[0, 2]], [[3, 0]],
  [[3, 0]], [[0, 2]], [[0, 1], [3, 2]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], []];

function toRGB(color) {
  const m = String(color).trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return [236, 238, 241];
  const n = parseInt(m[1], 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

const running = new Set();
function loop(t) {
  running.forEach(fn => fn(t));
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/** Campo de contornos animado num <canvas> dentro de `host`. A cor vem de getColor(). */
function contours(host, { getColor = () => "#eceef1", alpha = 0.16, step = 16, levels = 9, speed = 0.05, scale = 0.0026 } = {}) {
  const cv = document.createElement("canvas");
  cv.className = "fx-contours";
  cv.setAttribute("aria-hidden", "true");
  host.prepend(cv);
  const ctx = cv.getContext("2d");
  let w = 0, h = 0, cols = 0, rows = 0, field = new Float32Array(0), visible = true, last = 0;
  const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
  const dpr = Math.min(1.5, devicePixelRatio || 1);
  const st = innerWidth < 700 ? step * 1.4 : step;

  const resize = () => {
    const r = host.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / st) + 1; rows = Math.ceil(h / st) + 1;
    field = new Float32Array(cols * rows);
  };
  new ResizeObserver(resize).observe(host);
  resize();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);
  if (fine) {
    host.addEventListener("pointermove", e => { const r = host.getBoundingClientRect(); pointer.tx = e.clientX - r.left; pointer.ty = e.clientY - r.top; });
    host.addEventListener("pointerleave", () => { pointer.tx = pointer.ty = -1e4; });
  }

  const draw = t => {
    const z = t * 0.001 * speed;
    pointer.x += (pointer.tx - pointer.x) * 0.08; pointer.y += (pointer.ty - pointer.y) * 0.08;
    const pr = 170;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = i * st, y = j * st;
      let v = noise(x * scale, y * scale, z) * 0.7 + noise(x * scale * 2.1, y * scale * 2.1, z * 1.4 + 9) * 0.3;
      const dx = x - pointer.x, dy = y - pointer.y, d2 = dx * dx + dy * dy;
      if (d2 < pr * pr * 4) v += 0.22 * Math.exp(-d2 / (pr * pr)); // o mouse "levanta" o terreno
      field[j * cols + i] = v;
    }
    ctx.clearRect(0, 0, w, h);
    const [r, g, b] = toRGB(getColor());
    for (let l = 1; l <= levels; l++) {
      const iso = 0.18 + (l / (levels + 1)) * 0.78;
      const major = l % 3 === 0;
      ctx.strokeStyle = `rgba(${r},${g},${b},${major ? alpha * 1.8 : alpha})`;
      ctx.lineWidth = major ? 1.1 : 0.8;
      ctx.beginPath();
      for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
        const a = field[j * cols + i], bb = field[j * cols + i + 1], c = field[(j + 1) * cols + i + 1], d = field[(j + 1) * cols + i];
        const idx = (a > iso ? 8 : 0) | (bb > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
        const segs = CASES[idx];
        if (!segs.length) continue;
        const x = i * st, y = j * st;
        const pt = e => e === 0 ? [x + st * (iso - a) / (bb - a), y]
          : e === 1 ? [x + st, y + st * (iso - bb) / (c - bb)]
          : e === 2 ? [x + st * (iso - d) / (c - d), y + st]
          : [x, y + st * (iso - a) / (d - a)];
        for (const [e1, e2] of segs) { const p1 = pt(e1), p2 = pt(e2); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); }
      }
      ctx.stroke();
    }
  };

  if (reduce) { draw(0); return cv; }
  running.add(t => {
    if (!visible || document.hidden || t - last < 33) return; // ~30 quadros por segundo, só quando visível
    last = t;
    draw(t);
  });
  return cv;
}

/* ======================================================================
   Faixa quadriculada que se desfaz (bandeira de chegada)
   ====================================================================== */
function seam(host, { getAccent = () => "#e10600", rows = 4, cell = 16 } = {}) {
  const cv = document.createElement("canvas");
  cv.className = "fx-seam";
  cv.setAttribute("aria-hidden", "true");
  host.append(cv);
  const ctx = cv.getContext("2d");
  let cols = 0, grid = [], visible = true, last = 0;
  const resize = () => {
    const w = host.getBoundingClientRect().width;
    cols = Math.ceil(w / cell);
    cv.width = cols * cell; cv.height = rows * cell;
    grid = Array.from({ length: rows * cols }, (_, k) => {
      const r = Math.floor(k / cols), c = k % cols;
      const density = 1 - r / rows;            // denso em cima, rarefeito embaixo
      return ((r + c) % 2 === 0 && Math.random() < density * 0.95) ? 1 : (Math.random() < 0.04 ? 2 : 0);
    });
  };
  new ResizeObserver(resize).observe(host);
  resize();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);
  const draw = () => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    const acc = getAccent();
    for (let k = 0; k < grid.length; k++) {
      if (!grid[k]) continue;
      ctx.fillStyle = grid[k] === 2 ? acc : "rgba(236,238,241,.9)";
      ctx.fillRect((k % cols) * cell, Math.floor(k / cols) * cell, cell, cell);
    }
  };
  draw();
  if (reduce) return;
  running.add(t => {
    if (!visible || document.hidden || t - last < 110) return;
    last = t;
    for (let n = 0; n < Math.max(3, cols / 6); n++) {          // algumas casas trocam a cada quadro
      const k = Math.floor(Math.random() * grid.length), r = Math.floor(k / grid.length * rows);
      const density = 1 - r / rows;
      grid[k] = Math.random() < density * 0.55 ? 1 : (Math.random() < 0.06 ? 2 : 0);
    }
    draw();
  });
}

/* ======================================================================
   Números que contam até o valor
   ====================================================================== */
function countUp(el, dur = 1100) {
  const txt = el.textContent.trim();
  const m = txt.match(/^([+−-]?)(\d{1,5})$/);
  if (!m || reduce) return;
  const to = +m[2], sign = m[1];
  const t0 = performance.now();
  const step = t => {
    const k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 4);
    el.textContent = sign + Math.round(to * e);
    if (k < 1) requestAnimationFrame(step); else el.textContent = txt;
  };
  requestAnimationFrame(step);
}
const countIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { countUp(e.target); countIO.unobserve(e.target); }
}), { threshold: 0.6 });

/* ======================================================================
   Entradas com desfoque ao rolar
   ====================================================================== */
const revealIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); }
}), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

function reveal(selector, { stagger = 60, max = 8 } = {}) {
  if (reduce) return;
  const groups = new Map();
  $$(selector).forEach(el => {
    if (el.dataset.reveal != null) return;
    // só o que ainda está abaixo da dobra: o que já está na tela não pisca
    if (el.getBoundingClientRect().top < innerHeight * 0.92) return;
    const parent = el.parentElement;
    const i = groups.get(parent) || 0;
    groups.set(parent, i + 1);
    el.dataset.reveal = "";
    el.style.setProperty("--d", `${Math.min(i, max) * stagger}ms`);
    revealIO.observe(el);
  });
}

// títulos de seção entram palavra por palavra
function splitWords(h) {
  if (reduce || h.dataset.split) return;
  h.dataset.split = "1";
  const words = h.textContent.trim().split(/\s+/);
  h.innerHTML = words.map((w, i) => `<span class="w" style="--i:${i}"><span>${w}</span></span>`).join(" ");
  h.classList.add("split");
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { h.classList.add("in"); io.disconnect(); } }, { threshold: 0.3 });
  io.observe(h);
}

/* ======================================================================
   Inclinação 3D com reflexo (cards e garagem)
   ====================================================================== */
function tilt(el, { max = 8, glare = true } = {}) {
  if (reduce || !fine || el.dataset.tilt) return;
  el.dataset.tilt = "1";
  if (glare) el.classList.add("has-glare");
  let raf = 0;
  el.addEventListener("pointermove", e => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      el.style.setProperty("--ry", `${(px - 0.5) * max * 2}deg`);
      el.style.setProperty("--rx", `${(0.5 - py) * max}deg`);
      el.style.setProperty("--gx", `${px * 100}%`);
      el.style.setProperty("--gy", `${py * 100}%`);
      el.classList.add("tilting");
    });
  });
  el.addEventListener("pointerleave", () => {
    cancelAnimationFrame(raf);
    el.classList.remove("tilting");
    el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
  });
}

/* ======================================================================
   Lobby: só o relevo vivo no fundo (sem animação de entrada)
   ====================================================================== */
function lobbyIntro() {
  const hero = $(".lobby-hero");
  if (hero) contours(hero, { getColor: () => "#eceef1", alpha: 0.075, levels: 10 });
}

/* ======================================================================
   Página do campeonato
   ====================================================================== */
function seriesHero() {
  const hero = $("#hero");
  if (!hero || $("#series").hidden) return;
  contours(hero, { getColor: () => getComputedStyle(hero).getPropertyValue("--team"), alpha: 0.12, levels: 9 });

  // o número gigante se desenha em contorno
  const num = $(".hero-number", hero);
  if (num && !reduce) {
    const n = num.textContent.trim();
    num.innerHTML = `<svg viewBox="0 0 ${Math.max(1, n.length) * 520} 800" aria-hidden="true"><text x="100%" y="760" text-anchor="end">${n}</text></svg>`;
    num.classList.add("is-svg");
  }

  // paralaxe: o mouse move as camadas em profundidades diferentes; a rolagem afasta e desfoca o piloto
  const layers = $$(".hero-driver, .hero-car, .hero-number, .hero-copy", hero);
  let px = 0, py = 0, tx = 0, ty = 0;
  if (fine && !reduce) hero.addEventListener("pointermove", e => {
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
  });
  if (reduce) return;
  running.add(() => {
    px += (tx - px) * 0.06; py += (ty - py) * 0.06;
    const r = hero.getBoundingClientRect();
    const sp = clamp(-r.top / r.height, 0, 1);               // 0 no topo, 1 quando o hero saiu da tela
    if (sp >= 1 && Math.abs(tx - px) < 0.001) return;
    hero.style.setProperty("--px", px.toFixed(4));
    hero.style.setProperty("--py", py.toFixed(4));
    hero.style.setProperty("--sp", sp.toFixed(4));
  });
  layers.forEach(l => l.classList.add("parallax"));
}

function garage() {
  const g = $("#garagem");
  if (!g || $("#series").hidden) return;
  contours(g, { getColor: () => getComputedStyle(g).getPropertyValue("--team"), alpha: 0.07, levels: 8, scale: 0.0019 });
}

/** chamado pelo app a cada troca de equipe na garagem */
function onTeamChange(dir = 1) {
  const stage = $("#stage");
  if (!stage || reduce) return;
  stage.style.setProperty("--dir", dir);
  stage.classList.remove("rush");
  void stage.offsetWidth;
  stage.classList.add("rush");
  const overall = $("#overall");
  if (overall) countUp(overall, 900);
}

/* ======================================================================
   Guia de pistas: relevo atrás do traçado, na cor do campeonato
   ====================================================================== */
function guidePage() {
  const g = $("#guide");
  if (!g || g.hidden) return;
  const hero = $(".g-hero, .ct-hero", g);
  if (hero) contours(hero, { getColor: () => getComputedStyle(hero).getPropertyValue("--c"), alpha: 0.1, levels: 9 });
  const loc = $(".ct-local", g);
  if (loc) contours(loc, { getColor: () => "#eceef1", alpha: 0.05, levels: 7, scale: 0.0018 });
}

/* ======================================================================
   Faixa de últimos vencedores (lobby)
   ====================================================================== */
function ticker() {
  const t = $(".ticker-track");
  if (!t) return;
  // duplica o conteúdo para o laço infinito sem emenda
  t.innerHTML += t.innerHTML;
  t.querySelectorAll("li").forEach((li, i) => { if (i >= t.children.length / 2) li.setAttribute("aria-hidden", "true"); });
}

/* ======================================================================
   Início
   ====================================================================== */
function init() {
  clearTimeout(window.__motionFailsafe);
  root.classList.add("motion-ready");
  lobbyIntro();
  ticker();
  seriesHero();
  garage();
  guidePage();

  // faixas quadriculadas: antes do rodapé e (no campeonato) entre o hero e a garagem
  const accent = () => getComputedStyle(root).getPropertyValue("--series").trim() || "#e10600";
  const foot = $(".footer");
  if (foot) { const s = document.createElement("div"); s.className = "seam-host"; foot.before(s); seam(s, { getAccent: accent }); }
  if (!$("#series").hidden) { const s = document.createElement("div"); s.className = "seam-host"; $("#garagem").before(s); seam(s, { getAccent: accent, rows: 3 }); }

  $$(".section-head h2, .cat-block h3").forEach(splitWords);
  reveal(".section-head p, .series-card, .agenda-list li, .cat-block header p");
  reveal(".c-card, .race-list li, .ph-tile", { stagger: 50, max: 10 });
  reveal(".driver-card", { stagger: 45, max: 10 });
  reveal(".panel, .rules-explain article, .fact-list li, .garage-info, .gallery", { stagger: 70 });
  $$(".hero-stats dd, .lobby-stats dd, .ct-stats dd:not(.sm), .car-rank span, #standLists .table .val").forEach(el => countIO.observe(el));
  $$(".driver-card, .series-card, .c-card").forEach(el => tilt(el, { max: 7 }));
}

window.Motion = { onTeamChange, countUp, reduce };
init();
