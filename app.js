const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- Dados ao vivo ----------
   data/live.js é gerado de tempos em tempos pelo GitHub Actions (scripts/update-data.mjs) e traz
   classificação, vencedores, horários e textos do líder. Aqui ele é aplicado por cima dos dados fixos. */
(function applyLive() {
  const L = window.LIVE;
  if (!L) return;
  const when = L.generated ? new Date(L.generated) : null;
  const stamp = when ? ` Dados atualizados automaticamente em ${when.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${when.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.` : "";
  for (const [id, live] of Object.entries(L)) {
    const s = SERIES[id];
    if (!s || !live || typeof live !== "object") continue;
    const keyOf = d => String(d.n);
    const byKey = new Map((live.drivers || []).filter(d => d.key != null).map(d => [String(d.key), d]));
    for (const d of s.drivers) {
      const x = byKey.get(keyOf(d));
      if (x) Object.assign(d, { pos: x.pos, pts: x.pts, ...(x.wins != null ? { wins: x.wins } : {}) });
      else if (live.drivers?.length) Object.assign(d, { pos: null, pts: null });
    }
    for (const t of s.teams) {
      const x = (live.teams || []).find(y => y.id === t.id);
      if (x) Object.assign(t, { pos: x.pos, pts: x.pts });
    }
    // a ordem de cards e listas segue a classificação nova
    s.drivers.sort((a, b) => (a.pos || 99) - (b.pos || 99));
    (live.standings || []).forEach((rows, i) => {
      const tab = s.standings[i];
      if (!tab || !rows?.length) return;
      const subOf = team => tab.rows.find(r => r.team === team)?.sub;
      tab.rows = rows.map(r => ({ ...r, sub: r.sub ?? (i ? subOf(r.team) : undefined) }));
    });
    for (const [r, x] of Object.entries(live.calendar || {})) {
      const race = s.calendar.find(c => String(c.r) === r);
      if (race) Object.assign(race, x);
    }
    if (live.hero) Object.assign(s.hero, live.hero);
    if (live.status) s.status = live.status;
    if (live.updated) s.updated = live.updated + stamp;
  }
})();

/* ---------- Campeonatos agrupados por tipo de competição ---------- */
const CATEGORIES = [
  { id: "monopostos", name: "Monopostos", lede: "Carros de roda descoberta: do híbrido de 1.000 cv ao 100% elétrico.", series: ["f1", "formulae"] },
  { id: "motos", name: "Motovelocidade", short: "Motos", lede: "As motos de corrida mais rápidas do planeta.", series: ["motogp"] },
  { id: "endurance", name: "Endurance", lede: "Protótipos que aguentam até 24 horas de corrida sem parar.", series: ["wec"] },
];
CATEGORIES.forEach(c => { c.series = c.series.filter(id => SERIES[id]); });
const ORDER = CATEGORIES.flatMap(c => c.series);
const categoryOf = id => CATEGORIES.find(c => c.series.includes(id));

const params = new URLSearchParams(location.search);
const S = SERIES[params.get("c")] || null; // sem ?c= → lobby
const GUIDE = !S && !!window.Guide?.isRoute(); // ?c=pistas ou ?pista=<id> → guia de pistas

/* ---------- Datas e contagem regressiva ---------- */
const MONTHS = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
function raceDate(r) {
  if (r.start) return new Date(r.start);
  const m = String(r.date).match(/(\d{1,2})\s+([a-z]{3})/i);
  return m ? new Date(2026, MONTHS[m[2].toLowerCase()], +m[1], 12) : null;
}
function countdown(date) {
  const diff = date - Date.now();
  if (diff <= 0) return "hoje";
  const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60;
  return d > 0 ? `${d}d ${h}h` : `${h}h ${String(m).padStart(2, "0")}min`;
}
const nextOf = s => (s.seasonOver ? null : s.calendar.find(r => !r.winner));
function upcoming() {
  const now = Date.now() - 864e5;
  return ORDER.flatMap(id => {
    const s = SERIES[id];
    return s.seasonOver ? [] : s.calendar.filter(r => !r.winner).map(r => ({ s, r, d: raceDate(r) }));
  }).filter(x => x.d && x.d >= now).sort((a, b) => a.d - b.d);
}

// texto claro ou escuro sobre a cor da equipe, pelo contraste
function setTeamColor(el, hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  el.style.setProperty("--team", hex);
  el.style.setProperty("--on-team", lum > 0.2 ? "#0b0d10" : "#ffffff");
}

const leaderOf = s => s.drivers.find(d => d.pos === 1) || s.drivers[0];
// o veículo de lado (como no banner do lobby); na MotoGP, a vista de três quartos em vez da de frente
function vehicleOf(s) {
  for (const t of s.teams) { const v = teamViews(t).find(x => x.id !== "front"); if (v) return v; }
  return teamViews(s.teams[0])[0];
}
function teamViews(t) {
  return t.views || (t.img ? [{ id: "right", label: "Lateral direita", img: t.img, srcset: t.srcset }] : []);
}

/* ---------- Cabeçalho: categorias com seus campeonatos ---------- */
function renderTopbar() {
  // os campeonatos direto no menu, um clique só, na ordem das categorias
  $("#catNav").innerHTML = ORDER.map(id => {
    const s = SERIES[id], on = s === S;
    return `<a class="cat-link series-link${on ? " is-active" : ""}" href="?c=${id}" style="--c:${s.accent}" title="${esc(s.name)}: ${esc(s.status)}"${on ? ' aria-current="page"' : ""}><i aria-hidden="true"></i>${esc(s.short)}</a>`;
  }).join("") + `<span class="nav-sep" aria-hidden="true"></span><a class="cat-link${GUIDE ? " is-active" : ""}" href="?c=pistas"${GUIDE ? ' aria-current="page"' : ""}>Pistas</a>`;

  if (S) {
    const cat = categoryOf(S.id);
    const L = labels();
    $("#subbar").hidden = false;
    $("#subbar").style.setProperty("--series", S.accent);
    $("#crumb").innerHTML = `<a href="./">${esc(cat.name)}</a><span aria-hidden="true">/</span><b>${esc(S.name)}</b><small>${esc(S.season)}</small>`;
    const hasHl = window.HL && Object.keys(window.HIGHLIGHTS?.[S.id] || {}).length;
    $("#sectionNav").innerHTML = [["garagem", L.garage], ["pilotos", L.people], ...(hasHl ? [["destaques", "Destaques"]] : []), ["temporada", L.season], ["regras", L.rules], ["curiosidades", L.facts]]
      .map(([id, l]) => `<a href="#${id}">${esc(l)}</a>`).join("");
  }
}

function renderPill() {
  const pill = $("#nextPill");
  if (S) {
    const r = nextOf(S);
    if (!r) { pill.className = "next-pill off"; pill.innerHTML = `<span>${esc(S.offSeason || "Temporada encerrada")}</span>`; return; }
    pill.className = "next-pill";
    pill.innerHTML = `<span>${esc(r.pill || r.gp)}</span><b>${countdown(raceDate(r))}</b>`;
    return;
  }
  const n = upcoming()[0];
  if (!n) { pill.hidden = true; return; }
  pill.innerHTML = `<span>${esc(n.s.short)}: ${esc(n.r.pill || n.r.gp)}</span><b>${countdown(n.d)}</b>`;
}

function labels() {
  return Object.assign({
    garage: "Garagem", people: "Pilotos", season: `Temporada ${S.season}`, rules: "Regras", facts: "Curiosidades",
    vehicle: "carro", cta: "Entrar na garagem",
  }, S.labels);
}

/* ======================================================================
   LOBBY
   ====================================================================== */
function renderLobby() {
  document.title = "Pitstop: F1, Fórmula E, MotoGP e WEC";
  const all = ORDER.map(id => SERIES[id]);
  const next = upcoming();
  const drivers = all.reduce((n, s) => n + s.drivers.reduce((m, d) => m + (d.imgs ? d.imgs.length : 1), 0), 0);
  const teams = all.reduce((n, s) => n + s.teams.length, 0);

  // grid de largada: o veículo de lado de cada campeonato (na MotoGP, a vista de três quartos)
  const slot = s => { const v = vehicleOf(s); return { t: s.teams.find(t => teamViews(t).includes(v)) || s.teams[0], v }; };

  // faixa do topo: as próximas largadas de todos os campeonatos e os últimos vencedores; cada item leva para lá
  const venue = (s, r) => window.VENUES?.[s.id]?.[s.calendar.indexOf(r)];
  const comingUp = next.slice(0, 8).map(({ s, r, d }) => `
        <li class="tk-next" style="--c:${s.accent}"><a href="${venue(s, r) ? `?pista=${venue(s, r)}` : `?c=${s.id}#temporada`}"><b>${esc(s.short)}</b>${esc(r.gp)}<em>${countdown(d)}</em></a></li>`).join("");
  const winners = all.filter(s => !s.seasonOver).flatMap(s => s.calendar.filter(r => r.winner).slice(-2).reverse().map(r => ({ s, r })))
    .sort((a, b) => raceDate(b.r) - raceDate(a.r)).map(({ s, r }) => `
        <li style="--c:${s.accent}"><a href="?c=${s.id}${window.HL?.has(s.id, r.r) ? `&r=${r.r}#destaques` : "#temporada"}"><b>${esc(s.short)}</b>${esc(r.gp)}<span>${esc(r.winner)}</span></a></li>`).join("");

  $("#lobby").innerHTML = `
    <nav class="ticker" aria-label="Próximas largadas e últimos vencedores">
      <ul class="ticker-track">
        ${comingUp ? `<li class="tk-head">Próximas largadas</li>${comingUp}` : ""}
        ${winners ? `<li class="tk-head">Últimos vencedores</li>${winners}` : ""}
      </ul>
    </nav>

    <section class="lobby-hero" aria-labelledby="lobby-title">
      <div class="grid-slots" aria-label="Grid de largada dos campeonatos">
        ${all.map((s, i) => { const { t, v } = slot(s); return `
          <a class="slot" href="?c=${s.id}" style="--c:${s.accent};--i:${i}">
            <span class="slot-pos">P${i + 1}</span>
            <img src="${v.img}" alt="${esc(t.car)} da ${esc(t.name)}">
            <span class="slot-label"><b>${esc(s.short)}</b>${esc(t.name)} ${esc(t.car)}</span>
          </a>`; }).join("")}
      </div>
      <h1 class="wordmark" id="lobby-title" aria-label="Pitstop">${document.querySelector(".brand .logo-mark")?.outerHTML.replace('id="LM"', 'id="LM2"').replace("url(#LM)", "url(#LM2)") || ""}<span>Pit<b>stop</b></span></h1>
      <p class="lobby-lede">Carros, pilotos, fichas técnicas e a temporada de ${all.length} campeonatos, com dados atualizados e fotos oficiais.</p>
      <dl class="lobby-stats">
        <div><dt>Campeonatos</dt><dd>${all.length}</dd></div>
        <div><dt>Equipes e fabricantes</dt><dd>${teams}</dd></div>
        <div><dt>Pilotos</dt><dd>${drivers}</dd></div>
        ${next[0] ? `<div><dt>Próxima largada</dt><dd>${countdown(next[0].d)}</dd><small>${esc(next[0].s.short)}: ${esc(next[0].r.pill || next[0].r.gp)}</small></div>` : ""}
      </dl>
      <div class="lobby-cta">
        <a class="btn btn-solid" href="#campeonatos">Escolher campeonato</a>
      </div>
    </section>

    <section class="lobby-series" id="campeonatos" aria-labelledby="series-title">
      <div class="section-head"><h2 id="series-title">Campeonatos</h2></div>
      <div class="series-cards series-row">${ORDER.map(id => seriesCard(SERIES[id])).join("")}</div>
    </section>

    ${window.HL ? HL.lobbySection() : ""}

    ${window.Guide ? guideTeaser() : ""}

    ${next.length ? `
    <section class="agenda" aria-labelledby="agenda-title">
      <div class="section-head"><h2 id="agenda-title">Próximas corridas</h2><p>Todas as categorias, em ordem de data.</p></div>
      <ol class="agenda-list">${next.slice(0, 8).map(({ s, r, d }) => `
        <li style="--c:${s.accent}">
          <time datetime="${d.toISOString().slice(0, 10)}"><b>${d.getDate()}</b>${esc(r.date.replace(/^\d+\s*/, ""))}</time>
          <span class="ag-series">${esc(s.short)}</span>
          <span class="ag-gp"><b>${esc(r.gp)}</b><small>${esc(r.circuit)}</small></span>
          <span class="ag-when">${countdown(d)}</span>
          <a href="${venueOf(s, r) ? `?pista=${venueOf(s, r)}` : `?c=${s.id}#temporada`}" aria-label="${venueOf(s, r) ? `Guia da pista: ${esc(r.circuit)}` : `Ver calendário: ${esc(s.name)}`}"></a>
        </li>`).join("")}
      </ol>
    </section>` : ""}

    ${newsletterSection()}`;
  $("#footerText").textContent = "Pitstop é um projeto de fã, sem vínculo com os campeonatos. Dados e imagens de formula1.com, fiaformulae.com, motogp.com e fiawec.com.";
}

/* ---------- Boletim por e-mail (Buttondown) ---------- */
function nlForm(id) {
  const user = window.NEWSLETTER?.buttondown || "";
  return `
    <form class="nl-form" action="https://buttondown.com/api/emails/embed-subscribe/${esc(user)}" method="post" target="_blank" novalidate>
      <label class="sr-only" for="${id}">Seu e-mail</label>
      <div class="nl-row">
        <input id="${id}" type="email" name="email" placeholder="seu@email.com" autocomplete="email" inputmode="email" required>
        <button class="btn btn-solid" type="submit">Assinar</button>
      </div>
      <p class="nl-msg" role="status" aria-live="polite"></p>
      <p class="nl-fine">Usamos seu e-mail só para o boletim. A inscrição vale depois que você confirma pelo link que chega na caixa de entrada, e dá para sair com um clique em qualquer e-mail. <a href="privacidade.html">Privacidade</a></p>
    </form>`;
}

function newsletterSection() {
  // o exemplo mostra o resultado real mais recente
  const last = ORDER.filter(id => !SERIES[id].seasonOver).flatMap(id => SERIES[id].calendar.filter(r => r.winner).map(r => ({ s: SERIES[id], r, d: raceDate(r) })))
    .sort((a, b) => b.d - a.d)[0];
  const top = last && (last.s.standings[0]?.rows || []).slice(0, 3);
  return `
    <section class="newsletter" id="boletim" aria-labelledby="nl-title">
      <div class="nl-copy">
        <p class="kicker">Boletim Pitstop</p>
        <h2 id="nl-title">A bandeirada no seu e-mail</h2>
        <p class="nl-lede">O resultado de cada corrida assim que ela termina, com a classificação atualizada, e a agenda do fim de semana toda quinta-feira. F1, Fórmula E, MotoGP e WEC num e-mail só.</p>
        <ul class="nl-points">
          <li><b>Depois de cada corrida</b><span>Vencedor, top 5 e quem lidera o campeonato.</span></li>
          <li><b>Toda quinta-feira</b><span>As corridas do fim de semana, no horário de Brasília.</span></li>
          <li><b>Só corrida</b><span>Nada de propaganda. Cancelamento com um clique.</span></li>
        </ul>
        ${nlForm("nlEmail")}
      </div>
      ${last ? `
      <figure class="nl-sample" aria-label="Exemplo de boletim" style="--c:${last.s.accent}">
        <figcaption>Exemplo, com o último resultado</figcaption>
        <div class="nl-mail">
          <p class="nl-from"><b>Pitstop</b><span>Boletim</span></p>
          <p class="nl-subject">${esc(last.s.short)} · ${esc(last.r.gp)}: vitória de ${esc(last.r.winner)}</p>
          <p class="nl-head">${esc(last.s.name)} · Etapa ${esc(last.r.r)}</p>
          <p><b>Vitória de ${esc(last.r.winner)}</b> em ${esc(last.r.circuit)}, ${esc(last.r.date)}.</p>
          <ol>${top.map(x => `<li><span>${x.pos}. ${esc(x.name)}</span><b>${x.pts} pts</b></li>`).join("")}</ol>
          <p class="nl-more">Ver a temporada no Pitstop ›</p>
        </div>
      </figure>` : ""}
    </section>`;
}

// preferências do visitante sobre o boletim (só neste navegador)
const nlPref = {
  get(k) { try { return JSON.parse(localStorage.getItem("pitstop-nl") || "{}")[k]; } catch (e) { return undefined; } },
  set(k, v) { try { const o = JSON.parse(localStorage.getItem("pitstop-nl") || "{}"); o[k] = v; localStorage.setItem("pitstop-nl", JSON.stringify(o)); } catch (e) { /* sem armazenamento */ } },
};
const DAY = 864e5;

function initNewsletter() {
  // nas páginas internas, uma versão compacta no rodapé
  if (!$("#boletim")) $("#newsletterFoot").innerHTML = `
    <div class="nl-foot"><div><b>Boletim Pitstop</b><span>Resultados de cada corrida e a agenda do fim de semana no seu e-mail.</span></div>${nlForm("nlEmailFoot")}</div>`;
  // um só tratador para todos os formulários, inclusive os que aparecem depois (janela e balão)
  document.addEventListener("submit", async e => {
    const form = e.target.closest?.(".nl-form");
    if (!form) return;
    e.preventDefault();
    const input = form.querySelector("input"), btn = form.querySelector("button"), msg = form.querySelector(".nl-msg");
    const email = input.value.trim(), user = window.NEWSLETTER?.buttondown;
    const say = (t, ok) => { msg.textContent = t; msg.className = `nl-msg ${ok ? "ok" : "err"}`; };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say("Confira o e-mail: parece que falta alguma coisa.", false); input.focus(); return; }
    if (!user) { say("O boletim está sendo configurado. Volte em alguns dias para assinar.", false); return; }
    btn.disabled = true;
    try {
      await fetch(form.action, { method: "POST", mode: "no-cors", body: new URLSearchParams({ email, embed: "1" }) });
      say(`Quase lá: mandamos um e-mail para ${email}. Clique no link de confirmação para começar a receber.`, true);
      form.classList.add("done");
      nlPref.set("subscribed", Date.now());
      document.dispatchEvent(new CustomEvent("pitstop:subscribed"));
    } catch (err) {
      form.submit(); // sem conexão direta: abre a página de inscrição do Buttondown numa aba nova
    } finally { btn.disabled = false; }
  });
  initNudges();
}

/* ---------- Convites para o boletim: janela ao sair e balão no canto ----------
   Nunca aparecem para quem já assinou. A janela aparece no máximo uma vez por sessão e some por 7 dias
   se o visitante recusar; o balão some por 3 dias se for dispensado. */
function initNudges() {
  if (!window.NEWSLETTER?.buttondown || nlPref.get("subscribed")) return;
  const since = k => Date.now() - (nlPref.get(k) || 0);
  // fala da próxima corrida do campeonato ou do circuito da página; no resto, da próxima de qualquer campeonato
  const own = S && nextOf(S);
  const venue = params.get("pista");
  const atVenue = venue && window.Guide?.racesAt(venue).find(x => !x.r.winner && !x.s.seasonOver && x.d >= Date.now() - DAY);
  const n = own ? { s: S, r: own, d: raceDate(own) } : atVenue || upcoming()[0];
  const flagIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6 4h13l-2.5 4.5L19 13H6z" fill="currentColor"/><path d="M9 4h3v3H9zM15 4h3v3h-3zM12 7h3v3h-3zM9 10h3v3H9zM15 10h2.4l-.4 3H15z" fill="#0b0d10" opacity=".8"/></svg>`;

  /* ----- janela ao sair ----- */
  const modal = document.createElement("dialog");
  modal.className = "nl-modal";
  modal.setAttribute("aria-labelledby", "nlmTitle");
  modal.innerHTML = `
    <button class="modal-close" type="button" aria-label="Fechar">×</button>
    <div class="nlm-band" aria-hidden="true"></div>
    <div class="nlm-body">
      <p class="kicker">Boletim Pitstop</p>
      <h2 id="nlmTitle">Antes de sair, leve a bandeirada com você</h2>
      <p class="nlm-lede">O resultado de cada corrida assim que ela termina e a agenda do fim de semana toda quinta-feira. F1, Fórmula E, MotoGP e WEC num e-mail só, grátis e sem propaganda.</p>
      ${n ? `<p class="nlm-next"><i></i><span>Próxima largada: <b>${esc(n.s.short)} · ${esc(n.r.pill || n.r.gp)}</b></span><em>${countdown(n.d)}</em></p>` : ""}
      ${nlForm("nlEmailModal")}
      <button class="nlm-no" type="button">Agora não</button>
    </div>`;
  document.body.append(modal);
  modal.querySelector(".modal-close").onclick = () => modal.close();
  modal.querySelector(".nlm-no").onclick = () => modal.close();
  modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });
  modal.addEventListener("close", () => { if (!nlPref.get("subscribed")) nlPref.set("modalDismissed", Date.now()); });

  let modalShown = false;
  try { modalShown = sessionStorage.getItem("pitstop-nl-modal") === "1"; } catch (e) { /* sem armazenamento */ }
  const canModal = () => !modalShown && !nlPref.get("subscribed") && since("modalDismissed") > 7 * DAY && !document.querySelector("dialog[open]");
  const showModal = () => {
    if (!canModal()) return;
    modalShown = true;
    try { sessionStorage.setItem("pitstop-nl-modal", "1"); } catch (e) { /* sem armazenamento */ }
    bubble?.classList.add("away");
    modal.showModal();
    setTimeout(() => modal.querySelector("input").focus({ preventScroll: true }), 60);
  };

  // intenção de sair: no computador, o mouse sobe para fora da janela (rumo às abas ou ao "fechar");
  // no celular, uma rolagem rápida para cima depois de ter lido boa parte da página
  const armedAt = Date.now() + 6000;
  document.addEventListener("mouseout", e => {
    if (e.relatedTarget || e.clientY > 8 || Date.now() < armedAt) return;
    showModal();
  });
  if (matchMedia("(hover: none)").matches) {
    let lastY = scrollY, lastT = performance.now(), deepest = 0;
    addEventListener("scroll", () => {
      const now = performance.now(), y = scrollY;
      deepest = Math.max(deepest, y / Math.max(1, document.documentElement.scrollHeight - innerHeight));
      const speed = (lastY - y) / Math.max(1, now - lastT);           // px/ms; positivo = subindo
      if (deepest > 0.5 && speed > 2.2 && Date.now() > armedAt) showModal();
      lastY = y; lastT = now;
    }, { passive: true });
  }

  /* ----- balão no canto ----- */
  let bubble = null;
  if (since("bubbleDismissed") < 3 * DAY) return;
  bubble = document.createElement("aside");
  bubble.className = "nl-bubble";
  bubble.setAttribute("aria-label", "Boletim Pitstop");
  bubble.hidden = true;
  const pitch = n ? `Quer o resultado de ${esc(n.s.short)} · ${esc(n.r.pill || n.r.gp)} no seu e-mail?` : "Quer os resultados das corridas no seu e-mail?";
  bubble.innerHTML = `
    <div class="nlb-panel" id="nlbPanel" hidden>
      <b>Boletim Pitstop</b>
      <p>Resultado de cada corrida e a agenda do fim de semana. Grátis.</p>
      ${nlForm("nlEmailBubble")}
    </div>
    <div class="nlb-row">
      <button class="nlb-toggle" type="button" aria-expanded="false" aria-controls="nlbPanel"><span class="nlb-icon">${flagIcon}</span><span class="nlb-text">${pitch}</span></button>
      <button class="nlb-close" type="button" aria-label="Dispensar">×</button>
    </div>`;
  document.body.append(bubble);
  const panel = bubble.querySelector(".nlb-panel"), toggle = bubble.querySelector(".nlb-toggle");
  toggle.onclick = () => {
    const open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", open);
    bubble.classList.toggle("open", open);
    bubble.classList.remove("away");
    if (open) panel.querySelector("input").focus({ preventScroll: true });
  };
  bubble.querySelector(".nlb-close").onclick = () => { nlPref.set("bubbleDismissed", Date.now()); bubble.remove(); };
  document.addEventListener("pitstop:subscribed", () => setTimeout(() => bubble.remove(), 4000));

  // recolhe enquanto o formulário da própria página está à vista
  const io = new IntersectionObserver(es => {
    es.forEach(en => { en.target._nlIn = en.isIntersecting; });
    const onScreen = [...document.querySelectorAll("#boletim, .nl-foot")].some(x => x._nlIn);
    bubble.classList.toggle("away", onScreen && !bubble.classList.contains("open"));
  });
  document.querySelectorAll("#boletim, .nl-foot").forEach(x => io.observe(x));
  // aparece depois de 15 s ou de um pouco de leitura
  const reveal = () => { if (bubble.hidden) { bubble.hidden = false; requestAnimationFrame(() => bubble.classList.add("in")); } };
  setTimeout(reveal, 15000);
  addEventListener("scroll", function onScroll() {
    if (scrollY > innerHeight * 1.2) { reveal(); removeEventListener("scroll", onScroll); }
  }, { passive: true });
}

/* ---------- Aviso antes de levar o visitante ao YouTube ----------
   Alguns canais (o da F1, por exemplo) só deixam assistir no YouTube. Antes de abrir, o site explica e
   oferece ficar; o vídeo abre numa aba nova, e esta página continua exatamente onde estava. */
function initLeaveNotice() {
  const dlg = document.createElement("dialog");
  dlg.className = "leave-modal";
  dlg.setAttribute("aria-labelledby", "leaveTitle");
  dlg.innerHTML = `
    <button class="modal-close" type="button" aria-label="Fechar">×</button>
    <div class="lv-media"><img alt=""><span class="lv-yt" aria-hidden="true"><svg viewBox="0 0 28 20"><rect width="28" height="20" rx="5" fill="#ff0000"/><path d="M11 5.5v9l8-4.5z" fill="#fff"/></svg></span></div>
    <div class="lv-body">
      <p class="kicker">Indo para o YouTube</p>
      <h2 id="leaveTitle">Este vídeo abre no YouTube</h2>
      <p class="lv-video"></p>
      <p class="lv-why">O canal oficial só permite assistir a este vídeo no YouTube. Ele vai abrir numa nova aba, e o Pitstop continua aqui do jeito que você deixou: é só voltar para esta aba quando terminar.</p>
      <div class="lv-actions">
        <a class="btn btn-solid lv-go" target="_blank" rel="noopener">Abrir no YouTube ↗</a>
        <button class="btn btn-ghost lv-stay" type="button">Ficar no Pitstop</button>
      </div>
      <label class="lv-skip"><input type="checkbox"> Não mostrar este aviso de novo</label>
    </div>`;
  document.body.append(dlg);
  const skipKey = "pitstop-leave-skip";
  const skipped = () => { try { return localStorage.getItem(skipKey) === "1"; } catch (e) { return false; } };
  const close = () => dlg.close();
  dlg.querySelector(".modal-close").onclick = close;
  dlg.querySelector(".lv-stay").onclick = close;
  dlg.addEventListener("click", e => { if (e.target === dlg) close(); });
  dlg.querySelector(".lv-go").addEventListener("click", () => {
    if (dlg.querySelector(".lv-skip input").checked) { try { localStorage.setItem(skipKey, "1"); } catch (e) { /* sem armazenamento */ } }
    setTimeout(close, 150);
  });
  document.addEventListener("click", e => {
    const a = e.target.closest("a[data-leave]");
    if (!a || skipped() || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    dlg.querySelector(".lv-go").href = a.href;
    dlg.querySelector(".lv-media img").src = a.dataset.thumb || "";
    dlg.querySelector(".lv-video").textContent = a.dataset.title || "";
    dlg.querySelector(".lv-skip input").checked = false;
    dlg.showModal();
    dlg.querySelector(".lv-go").focus();
  });
}

const venueOf = (s, r) => window.VENUES?.[s.id]?.[s.calendar.indexOf(r)];

// lobby: as próximas pistas, com o traçado desenhado
function guideTeaser() {
  const G = window.Guide, list = G.venues().filter(x => x.up).slice(0, 4);
  if (!list.length) return "";
  return `
    <section class="lobby-guide" aria-labelledby="lg-title">
      <div class="section-head"><h2 id="lg-title">Guia de pistas</h2><p>Traçado, ficha, recorde, fotos e mapa de satélite de todos os circuitos do ano.</p></div>
      <div class="c-grid">${list.map(({ c, up }) => `
        <a class="c-card" href="?pista=${c.id}" style="--c:${up.s.accent}">
          <span class="c-art">${G.outline(c)}<span class="c-next">${esc(up.s.short)} · ${esc(up.r.date)}</span></span>
          <span class="c-body"><b class="c-name">${esc(c.name)}</b><small class="c-place">${esc(c.city)}, ${esc(c.country)}${G.kmOf(c) ? ` · ${G.kmOf(c)}` : ""}</small></span>
        </a>`).join("")}
      </div>
      <a class="btn btn-ghost lg-cta" href="?c=pistas">Abrir o guia de pistas</a>
    </section>`;
}

function seriesCard(s) {
  const v = vehicleOf(s), lead = leaderOf(s), n = nextOf(s);
  const leadImg = lead.img || (lead.imgs && lead.imgs[0]);
  const tall = v.id === "front";
  return `
    <a class="series-card${tall ? " is-tall" : ""}" href="?c=${s.id}" style="--c:${s.accent}">
      <div class="sc-media"><img src="${v.img}" alt="" loading="lazy"></div>
      <div class="sc-body">
        <h4>${esc(s.name)} <small>${esc(s.season)}</small></h4>
        <p class="sc-status">${esc(s.status)}</p>
        <div class="sc-leader">
          ${leadImg ? `<img src="${leadImg}" alt="" loading="lazy">` : ""}
          <span><small>${s.seasonOver ? "Campeão" : "Líder"}</small><b>${esc(lead.imgs ? lead.last : `${lead.first} ${lead.last}`)}</b><em>${lead.pts} pts</em></span>
        </div>
        <p class="sc-next">${n ? `Próxima: <b>${esc(n.pill || n.gp)}</b>, ${esc(n.date)}` : esc(s.offSeason || "Temporada encerrada")}</p>
        <span class="sc-cta">Abrir ${esc(s.name)}</span>
      </div>
    </a>`;
}

/* ======================================================================
   PÁGINA DO CAMPEONATO
   ====================================================================== */
let teamById, colorOf;

function renderSeriesChrome() {
  const L = labels();
  document.title = `Pitstop: ${S.name} ${S.season}`;
  document.documentElement.style.setProperty("--series", S.accent);
  $("#garage-title").textContent = L.garage;
  $("#garage-lede").textContent = S.garageLede;
  $("#drivers-title").textContent = L.people;
  $("#drivers-lede").textContent = S.peopleLede;
  $("#season-title").textContent = L.season;
  $("#updated").textContent = S.updated;
  $("#rules-title").textContent = S.rules.title;
  $("#rules-lede").textContent = S.rules.lede;
  $("#footerText").innerHTML = `Pitstop é um projeto de fã, sem vínculo com os campeonatos. ${S.footer}`;
}

/* ---------- Hero ---------- */
function renderHero() {
  const h = S.hero, hero = $("#hero"), L = labels();
  hero.className = `hero hero--${h.kind}`;
  setTeamColor(hero, h.color);
  const media = h.kind === "wide"
    ? `<img class="hero-car" src="${h.img}" alt="${esc(h.alt)}" fetchpriority="high">`
    : `<img class="hero-driver" src="${h.img}" alt="${esc(h.alt)}" fetchpriority="high">`;
  hero.innerHTML = `
    ${h.number ? `<div class="hero-number" aria-hidden="true">${esc(h.number)}</div>` : ""}
    <div class="hero-copy">
      <p class="hero-kicker">${esc(h.kicker)}</p>
      <h1 class="hero-name" style="--fit:${Math.round(1700 / Math.max(h.last.length, 6))}px"><span>${esc(h.first)}</span>${esc(h.last)}</h1>
      <p class="hero-lede">${esc(h.lede)}</p>
      <dl class="hero-stats">${h.stats.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
      <div class="hero-actions">
        <a class="btn btn-solid" href="#garagem">${esc(L.cta)}</a>
        <a class="btn btn-ghost" href="#temporada">Ver classificação</a>
      </div>
    </div>
    ${media}`;
}

/* ---------- Garagem, com troca de ângulo ---------- */
const ALL_ANGLES = ["Lateral direita", "Lateral esquerda", "Frente", "Traseira", "Vista de cima"];
let current = 0, viewId = null;

function renderPicker() {
  $("#teamPicker").innerHTML = S.teams.map((t, i) => `
    <button class="team-chip" role="tab" style="--c:${t.color}" data-i="${i}" aria-selected="${i === current}">
      <i></i>${esc(t.name)}
    </button>`).join("");
  $("#teamPicker").addEventListener("click", e => {
    const b = e.target.closest(".team-chip");
    if (b) selectTeam(+b.dataset.i);
  });
}

function renderStage() {
  const t = S.teams[current], views = teamViews(t);
  const v = views.find(x => x.id === viewId) || views[0];
  viewId = v.id;
  const media = $("#stageMedia");
  media.className = `stage-media view-${v.id} ${swapDir < 0 ? "drive-l" : "drive-r"}`;
  media.innerHTML = `<img class="stage-car" src="${v.img}" ${v.srcset ? `srcset="${v.srcset}" sizes="(max-width: 1500px) 100vw, 1500px"` : ""} alt="${esc(t.car)}, ${labels().vehicle} da ${esc(t.name)}: ${esc(v.label.toLowerCase())}">`;
  void media.offsetWidth;

  $("#viewSwitch").innerHTML = views.map(x =>
    `<button aria-pressed="${x.id === v.id}" data-v="${x.id}">${esc(x.label)}</button>`).join("");
  const missing = ALL_ANGLES.filter(a => !views.some(x => x.label === a));
  $("#viewNote").textContent = missing.length ? `Sem foto oficial publicada: ${missing.join(", ").toLowerCase()}.` : "";
}

let swapDir = 1;
function selectTeam(i, { scrollChip = true } = {}) {
  swapDir = i < current ? -1 : 1;
  current = (i + S.teams.length) % S.teams.length;
  if (scrollChip) window.Motion?.onTeamChange(swapDir);
  const t = S.teams[current];
  setTeamColor($("#garagem"), t.color);

  document.querySelectorAll(".team-chip").forEach((c, k) => {
    c.setAttribute("aria-selected", k === current);
    if (k === current && scrollChip) c.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  });

  renderStage();
  renderGallery(t);
  if (document.readyState === "complete") preloadNeighbors(); else addEventListener("load", preloadNeighbors, { once: true });
  const ghost = $("#stageGhost");
  ghost.textContent = t.ghost || t.car;
  ghost.classList.remove("swap"); void ghost.offsetWidth; ghost.classList.add("swap");
  const logo = $("#teamLogo");
  logo.hidden = !t.logo;
  if (t.logo) { logo.src = t.logo; logo.alt = `Logo ${t.name}`; }
  $("#carName").textContent = t.car;
  $("#teamFull").textContent = t.full;
  $("#teamPos").textContent = t.pos ? `P${t.pos}` : "";
  $("#teamPts").textContent = t.ptsLabel || "";
  $("#carNote").textContent = t.note;

  const entries = Object.entries(t.ratings);
  $("#ratings").innerHTML = entries.map(([k, v]) => `
    <div class="rating-row">
      <span>${S.ratingLabels[k]}</span><strong>${v}</strong>
      <div class="bar" role="meter" aria-label="${S.ratingLabels[k]}" aria-valuenow="${v}" aria-valuemin="0" aria-valuemax="100">
        ${Array.from({ length: 20 }, (_, s) => `<i class="${s < Math.round(v / 5) ? "on" : ""}" style="--k:${s}"></i>`).join("")}
      </div>
    </div>`).join("");
  $("#overall").textContent = Math.round(entries.reduce((a, [, v]) => a + v, 0) / entries.length);

  $("#specs").innerHTML =
    t.specs.map(([k, v]) => `<div class="team-spec"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("") +
    S.commonSpecs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");

  const crew = S.drivers.filter(d => d.team === t.id);
  $("#teamDriversTitle").textContent = labels().people;
  $("#teamDrivers").innerHTML = crew.map(d => `
    <button class="mini-driver" data-k="${S.drivers.indexOf(d)}">
      <img src="${d.img || d.imgs[0]}" alt="" loading="lazy">
      <div><b>${esc(d.imgs ? d.last : d.last)}</b><small>${d.imgs ? "" : `#${esc(d.n)}`}${d.pos ? ` · P${d.pos}` : ""}${d.pts != null ? ` · ${d.pts} pts` : ""}</small></div>
    </button>`).join("");
}

/* ---------- Galeria do veículo: vídeos oficiais e fotos reais ---------- */
let galItems = [], galFilter = "all", galList = [], galIndex = 0, ytPlayer = null, ytReady = null;
const ytThumb = id => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const ytWatch = id => `https://www.youtube.com/watch?v=${id}`;
const inModal = x => !(x.t === "v" && x.ext); // vídeos bloqueados fora do YouTube abrem direto lá

function renderGallery(t) {
  galItems = (window.MEDIA?.[S.id]?.[t.id]) || [];
  const nv = galItems.filter(x => x.t === "v").length, np = galItems.length - nv;
  $("#gallery").hidden = !galItems.length;
  $("#galleryTitle").textContent = `Galeria do ${t.car}`;
  if (!nv || !np) galFilter = "all";
  $("#galleryTabs").innerHTML = (nv && np ? [["all", `Tudo ${galItems.length}`], ["v", `Vídeos ${nv}`], ["p", `Fotos ${np}`]] : [])
    .map(([k, l]) => `<button role="tab" aria-selected="${k === galFilter}" data-f="${k}">${l}</button>`).join("");
  galList = galItems.filter(x => galFilter === "all" || x.t === galFilter);
  $("#galleryStrip").innerHTML = galList.map((x, i) => {
    if (x.t === "v" && x.ext) return `
    <a class="g-tile is-ext" href="${ytWatch(x.id)}" target="_blank" rel="noopener" data-leave data-title="${esc(x.title)}" data-thumb="${ytThumb(x.id)}">
      <span class="g-thumb"><img src="${ytThumb(x.id)}" alt="" loading="lazy"><span class="g-play" aria-hidden="true"></span>${x.engine ? `<span class="g-badge">Som do motor</span>` : ""}<span class="g-ext">Só no YouTube ↗</span></span>
      <span class="g-cap"><b>${esc(x.title)}</b><small>Vídeo · ${esc(x.ch)} · abre no YouTube</small></span>
    </a>`;
    if (x.t === "v") return `
    <button class="g-tile" data-i="${i}">
      <span class="g-thumb"><img src="${ytThumb(x.id)}" alt="" loading="lazy"><span class="g-play" aria-hidden="true"></span>${x.engine ? `<span class="g-badge">Som do motor</span>` : ""}</span>
      <span class="g-cap"><b>${esc(x.title)}</b><small>Vídeo · ${esc(x.ch)}</small></span>
    </button>`;
    return `
    <button class="g-tile" data-i="${i}">
      <span class="g-thumb"><img src="${x.thumb}" alt="" loading="lazy"></span>
      <span class="g-cap"><b>${esc(x.title)}</b><small>Foto · ${esc(x.credit)}</small></span>
    </button>`;
  }).join("");
  $("#galleryStrip").scrollLeft = 0;
  const hasCommons = galItems.some(x => x.t === "p" && /commons/.test(x.link));
  const hasExt = galItems.some(x => x.ext);
  $("#galleryNote").textContent = [nv && "Vídeos dos canais oficiais no YouTube.",
    hasExt && "Os marcados com “Só no YouTube” têm a exibição em outros sites bloqueada pelo dono e abrem no YouTube.",
    np && (hasCommons ? "Fotos da Wikimedia Commons, com autor e licença." : "Fotos oficiais do campeonato.")].filter(Boolean).join(" ");
  $("#engineBtn").hidden = !galItems.some(x => x.engine && !x.ext);
}

// player oficial do YouTube: avisa (onError) quando o dono bloqueia a exibição fora do YouTube
function loadYT() {
  if (window.YT?.Player) return Promise.resolve();
  return ytReady ||= new Promise(res => {
    window.onYouTubeIframeAPIReady = res;
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.append(s);
  });
}
function stopPlayer() { try { ytPlayer?.destroy(); } catch (e) { /* já removido */ } ytPlayer = null; }
function blockedCard(x) {
  return `<div class="mm-blocked">
    <img src="${ytThumb(x.id)}" alt="">
    <div><b>Este vídeo só pode ser assistido no YouTube</b>
    <p>O dono do vídeo bloqueou a exibição em outros sites.</p>
    <a class="btn btn-solid" href="${ytWatch(x.id)}" target="_blank" rel="noopener">Assistir no YouTube ↗</a></div>
  </div>`;
}

async function openMedia(i, step = 1) {
  if (!galList.some(inModal)) return;
  galIndex = (i + galList.length) % galList.length;
  while (!inModal(galList[galIndex])) galIndex = (galIndex + step + galList.length) % galList.length;
  const x = galList[galIndex], shown = galList.filter(inModal), pos = shown.indexOf(x) + 1;
  stopPlayer();
  $("#mediaCaption").innerHTML = x.t === "v"
    ? `<b>${esc(x.title)}</b> <span>Vídeo oficial · ${esc(x.ch)} · ${pos} de ${shown.length}</span>`
    : `<b>${esc(x.title)}</b> <span><a href="${x.link}" target="_blank" rel="noopener">${esc(x.credit)}</a> · ${pos} de ${shown.length}</span>`;
  const modal = $("#mediaModal");
  if (!modal.open) modal.showModal();
  if (x.t !== "v") { $("#mediaStage").innerHTML = `<img src="${x.src}" alt="${esc(x.title)}">`; return; }

  $("#mediaStage").innerHTML = `<div class="mm-video"><div id="ytHost"></div></div>`;
  await loadYT();
  if (!modal.open || galList[galIndex] !== x) return; // o usuário já mudou de item
  ytPlayer = new YT.Player("ytHost", {
    videoId: x.id, host: "https://www.youtube-nocookie.com",
    playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
    events: { onError: e => { if ([100, 101, 150, 153].includes(e.data) && galList[galIndex] === x) { stopPlayer(); $("#mediaStage").innerHTML = blockedCard(x); } } },
  });
}

function initMediaModal() {
  const modal = $("#mediaModal");
  $("#mediaPrev").onclick = () => openMedia(galIndex - 1, -1);
  $("#mediaNext").onclick = () => openMedia(galIndex + 1, 1);
  $("#mediaClose").onclick = () => modal.close();
  modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });
  modal.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") openMedia(galIndex + 1, 1);
    if (e.key === "ArrowLeft") openMedia(galIndex - 1, -1);
  });
  // fechar a janela para o vídeo (e o som) imediatamente
  modal.addEventListener("close", () => { stopPlayer(); $("#mediaStage").innerHTML = ""; });
}
window.openGallery = (list, i = 0) => { galList = list; openMedia(i); };

function initGallery() {
  $("#galleryTabs").addEventListener("click", e => {
    const b = e.target.closest("[data-f]");
    if (b) { galFilter = b.dataset.f; renderGallery(S.teams[current]); }
  });
  $("#galleryStrip").addEventListener("click", e => {
    const b = e.target.closest("button[data-i]");
    if (b) openMedia(+b.dataset.i);
  });
  $("#engineBtn").addEventListener("click", () => {
    galFilter = "all"; renderGallery(S.teams[current]);
    openMedia(galList.findIndex(x => x.engine && !x.ext));
  });
}

function initGarage() {
  initGallery();
  renderPicker();
  selectTeam(0, { scrollChip: false });
  $("#prevTeam").onclick = () => selectTeam(current - 1);
  $("#nextTeam").onclick = () => selectTeam(current + 1);
  $("#viewSwitch").addEventListener("click", e => {
    const b = e.target.closest("[data-v]");
    if (b && b.dataset.v !== viewId) { viewId = b.dataset.v; renderStage(); }
  });
  $("#garagem").addEventListener("keydown", e => {
    if (e.target.closest("#viewSwitch, #gallery")) return;
    if (e.key === "ArrowRight") { selectTeam(current + 1); e.preventDefault(); }
    if (e.key === "ArrowLeft") { selectTeam(current - 1); e.preventDefault(); }
  });
  $("#teamDrivers").addEventListener("click", e => {
    const b = e.target.closest("[data-k]");
    if (b) openDriver(+b.dataset.k);
  });
}

// adianta só as fotos das equipes vizinhas (as setas levam a elas), e nada em conexão lenta ou modo econômico
const preloaded = new Set();
function preloadNeighbors() {
  const c = navigator.connection;
  if (c && (c.saveData || /2g/.test(c.effectiveType || ""))) return;
  [current - 1, current + 1].forEach(i => {
    const t = S.teams[(i + S.teams.length) % S.teams.length], v = teamViews(t).find(x => x.id === viewId) || teamViews(t)[0];
    if (v && !preloaded.has(v.img)) { preloaded.add(v.img); new Image().src = v.img; }
  });
}

/* ---------- Pilotos ---------- */
function renderDrivers() {
  const grid = $("#driverGrid");
  grid.style.setProperty("--card-w", S.card?.w || "86%");
  grid.style.setProperty("--card-top", S.card?.top || "8%");
  grid.innerHTML = S.drivers.map((d, k) => {
    const t = teamById[d.team];
    const media = d.imgs
      ? `<span class="multi">${d.imgs.map(src => `<img src="${src}" alt="" loading="lazy">`).join("")}</span>`
      : `<img src="${d.img}" alt="" loading="lazy">`;
    return `
    <button class="driver-card${d.imgs ? " crew" : ""}" style="--c:${t.color}" data-k="${k}" aria-label="${esc(d.first)} ${esc(d.last)}, ${esc(t.name)}${d.pos ? `, ${d.pos}º lugar` : ""}">
      <span class="num" aria-hidden="true">${esc(d.n)}</span>
      ${media}
      <div class="meta">
        <span class="pos">${d.pos ? `<b>P${d.pos}</b> ` : ""}${d.pts != null ? `${d.pts} pts · ` : ""}${esc(t.name)}</span>
        <h3><small>${esc(d.first)}</small>${esc(d.last)}</h3>
      </div>
    </button>`;
  }).join("");
  grid.addEventListener("click", e => {
    const b = e.target.closest("[data-k]");
    if (b) openDriver(+b.dataset.k);
  });
}

function age(born) {
  const [d, m, y] = born.split("/").map(Number);
  const now = new Date();
  let a = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) a--;
  return a;
}

function openDriver(k) {
  const d = S.drivers[k];
  const t = teamById[d.team];
  const modal = $("#driverModal");
  modal.style.setProperty("--c", t.color);
  const mates = d.imgs ? [] : S.drivers.filter(x => x.team === d.team && x !== d).map(x => x.last);
  const facts = [
    d.country && ["Nacionalidade", d.country],
    d.born && ["Idade", `${age(d.born)} anos`],
    d.born && ["Nascimento", d.place ? `${d.born}, ${d.place}` : d.born],
    d.debut && [S.debutLabel || "Estreia", d.debut],
    d.titles != null && ["Títulos mundiais", d.titles || "—"],
    mates.length && [mates.length > 1 ? "Companheiros" : "Companheiro", mates.join(", ")],
    ...(d.extra || []),
  ].filter(Boolean);
  const stats = [
    d.pos && ["Posição", `P${d.pos}`],
    d.pts != null && [`Pontos ${S.season}`, d.pts],
    d.wins != null && [`Vitórias ${S.season}`, d.wins],
  ].filter(Boolean);
  const media = d.imgs
    ? `<div class="full multi">${d.imgs.map(src => `<img src="${src}" alt="">`).join("")}</div>`
    : `<img class="full" src="${d.imgFull || d.img}" alt="${esc(d.first)} ${esc(d.last)}">`;
  $("#modalBody").classList.toggle("crew", !!d.imgs);
  $("#modalBody").innerHTML = `
    ${media}
    <div class="modal-info">
      <div class="big-num">${esc(d.n)}</div>
      <h2 id="modalName"><small>${esc(d.first)}</small>${esc(d.last)}</h2>
      <p class="team-line">${esc(t.full)} · ${esc(t.car)}</p>
      ${d.bio ? `<p class="bio">${esc(d.bio)}</p>` : ""}
      ${stats.length ? `<dl class="modal-stats" style="--n:${stats.length}">${stats.map(([a, b]) => `<div><dt>${a}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl>` : ""}
      <dl class="modal-facts">${facts.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl>
    </div>`;
  modal.showModal();
}

function initModal() {
  const modal = $("#driverModal");
  $("#modalClose").onclick = () => modal.close();
  modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });
}

/* ---------- Temporada ---------- */
function renderStandings() {
  const tabs = S.standings, next = nextOf(S);
  $("#standTabs").innerHTML = tabs.map((tab, i) =>
    `<button role="tab" aria-selected="${i === 0}" data-i="${i}">${esc(tab.label)}</button>`).join("");
  $("#standTabs").hidden = tabs.length < 2;
  $("#standLists").innerHTML = tabs.map((tab, i) => {
    const max = Math.max(...tab.rows.map(r => r.pts || 0), 1);
    return `
    <div ${i ? "hidden" : ""} data-i="${i}">
      ${tab.note ? `<p class="panel-sub">${esc(tab.note)}</p>` : ""}
      <ol class="table">${tab.rows.map(r => `
        <li style="--c:${r.color || colorOf(r.team)}">
          <span class="p">${r.pos}</span><span class="stripe"></span>
          <span class="who"><b>${esc(r.name)}</b><small>${esc(r.sub || (teamById[r.team] || {}).name || "")}</small></span>
          <span class="val">${r.pts ?? "—"}</span>
          <span class="gap" aria-hidden="true"><i style="width:${((r.pts || 0) / max) * 100}%"></i></span>
        </li>`).join("")}
      </ol>
    </div>`;
  }).join("");
  $("#standTabs").onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    document.querySelectorAll("#standTabs button").forEach(x => x.setAttribute("aria-selected", x === b));
    document.querySelectorAll("#standLists > div").forEach(x => { x.hidden = x.dataset.i !== b.dataset.i; });
  };

  $("#calendarNote").textContent = S.calendarNote || `${S.calendar.length} etapas.`;
  const venues = window.VENUES?.[S.id] || [];
  $("#calendar").innerHTML = S.calendar.map((r, i) => {
    const cls = r.winner ? "done" : r === next ? "next" : "";
    const c = r.winner ? colorOf(r.team) : "";
    const res = r.winner
      ? `<b>${esc(r.winner)}</b><small>${esc(r.date)}</small>`
      : r === next ? `<b>Próxima</b><small>${esc(r.date)}</small>` : `<small>${esc(r.date)}</small>`;
    return `<li class="${cls}"${c ? ` style="--c:${c}"` : ""}>
      <span class="rnd">${esc(r.r)}</span>
      <span class="gp"><b>${esc(r.gp)}</b>${venues[i] ? `<a class="to-track" href="?pista=${venues[i]}">${esc(r.circuit)} <span aria-hidden="true">›</span></a>` : `<small>${esc(r.circuit)}</small>`}</span>
      <span class="res">${res}${r.winner && window.HL?.has(S.id, r.r) ? `<a class="to-hl" href="#destaques" data-hl="${r.r}">▶ Destaques</a>` : ""}</span>
    </li>`;
  }).join("");
}

/* ---------- Regras, curiosidades e outros campeonatos ---------- */
function renderRules() {
  const c = S.rules.compare;
  $("#rulesTable").hidden = !c;
  if (c) {
    $("#rulesHead").innerHTML = `<tr>${c.head.map(h => `<th scope="col">${esc(h)}</th>`).join("")}</tr>`;
    $("#rulesBody").innerHTML = c.rows.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join("")}</tr>`).join("");
    $("#rulesTable").classList.toggle("is-compare", c.head.length === 3 && !c.plain);
  }
  $("#rulesCards").innerHTML = S.rules.cards.map(([h, p]) => `<article><h3>${esc(h)}</h3><p>${esc(p)}</p></article>`).join("");
  $(".rules-grid").classList.toggle("cards-only", !c);
  $("#facts").innerHTML = S.facts.map(f => `<li><b>${esc(f.big)}</b><p>${esc(f.text)}</p></li>`).join("");
  $("#otherSeries").innerHTML = ORDER.filter(id => SERIES[id] !== S).map(id => seriesCard(SERIES[id])).join("");
}

function initSectionNav() {
  const links = [...document.querySelectorAll("#sectionNav a")];
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) links.forEach(a => a.classList.toggle("active", a.hash === `#${en.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  links.forEach(a => { const s = document.querySelector(a.hash); if (s) io.observe(s); });
}

/* ---------- Início ---------- */
renderTopbar();
renderPill();
queueMicrotask(initNewsletter);
setInterval(renderPill, 30000);
initMediaModal();
initLeaveNotice();
if (GUIDE) {
  $("#lobby").hidden = true;
  Guide.render();
  initSectionNav();
} else if (S) {
  teamById = Object.fromEntries(S.teams.map(t => [t.id, t]));
  colorOf = id => (teamById[id] || {}).color || "#888";
  $("#lobby").hidden = true;
  $("#series").hidden = false;
  renderSeriesChrome();
  renderHero();
  initGarage();
  renderDrivers();
  initModal();
  window.HL?.seriesSection(S);
  renderStandings();
  renderRules();
  initSectionNav();
} else {
  renderLobby();
}
