// Pitstop · destaques: os momentos mais épicos de cada corrida (vídeos oficiais e fotos livres).
// Os dados vêm de data/highlights.js, que o robô (scripts/highlights.mjs) atualiza depois de cada corrida.
// Carregado antes de app.js; as funções usam SERIES, ORDER, raceDate, esc, $ e openGallery na hora em que rodam.
window.HL = (() => {
  const H = window.HIGHLIGHTS || {};
  const KIND = {
    race: "Melhores momentos da corrida", moments: "Momentos épicos", extended: "Melhores momentos estendidos",
    overtakes: "Ultrapassagens", qualifying: "Classificação", onboard: "Top 10 câmeras onboard", sprint: "Sprint",
    replay: "Corrida completa", start: "A largada", radio: "Rádio das equipes", react: "Reação dos pilotos", epic: "Lance da corrida",
  };
  // ordem de exibição: primeiro o que toca dentro do site (o vídeo grande nunca manda o visitante embora)
  const ordered = h => [...h.videos.filter(v => !v.ext), ...h.videos.filter(v => v.ext)];
  const thumb = (id, q = "hqdefault") => `https://i.ytimg.com/vi/${id}/${q}.jpg`;
  // a capa em alta às vezes não existe: cai para a padrão
  const fallback = `onerror="if(!this.dataset.f){this.dataset.f=1;this.src=this.src.replace(/maxresdefault|sddefault/,'hqdefault')}"`;

  const racesWith = sid => (SERIES[sid]?.calendar || [])
    .filter(r => r.winner && H[sid]?.[r.r] && (H[sid][r.r].videos.length || H[sid][r.r].photos?.length))
    .sort((a, b) => raceDate(b) - raceDate(a));

  // itens para a janela de mídia (mesma da galeria da garagem)
  const itemsOf = (sid, r) => {
    const h = H[sid]?.[r.r] || { videos: [], photos: [] };
    return [
      ...ordered(h).map(v => ({ t: "v", id: v.id, title: `${KIND[v.kind] || ""}${KIND[v.kind] ? ": " : ""}${v.title}`, ch: v.ch, ext: v.ext })),
      ...(h.photos || []).map(p => ({ t: "p", ...p })),
    ];
  };
  const open = (sid, round, i = 0) => {
    const r = SERIES[sid].calendar.find(x => String(x.r) === String(round));
    if (r) window.openGallery(itemsOf(sid, r), i);
  };

  /* ---------- página do campeonato: seção "Destaques" ---------- */
  function seriesSection(S) {
    const races = racesWith(S.id);
    if (!races.length) return false;
    const want = new URLSearchParams(location.search).get("r");
    let cur = races.find(r => String(r.r) === want) || races[0];
    const host = $("#destaques");
    host.hidden = false;
    $("#hl-lede").textContent = `Os momentos mais épicos de cada etapa: vídeos oficiais dos campeonatos no YouTube e fotos da Wikimedia Commons, com autor e licença.`;
    $("#hlRaces").innerHTML = races.map(r => `
      <button role="tab" data-r="${r.r}" aria-selected="${r === cur}">
        <small>Etapa ${esc(r.r)} · ${esc(r.date)}</small><b>${esc(r.gp)}</b><span>${esc(r.winner)}</span>
      </button>`).join("");

    const draw = () => {
      const items = itemsOf(S.id, cur), h = H[S.id][cur.r];
      const first = ordered(h)[0], rest = items.slice(first ? 1 : 0);
      const team = S.teams.find(t => t.id === cur.team);
      $("#hlStage").innerHTML = `
        ${first ? `
        <${first.ext ? `a href="https://www.youtube.com/watch?v=${first.id}" target="_blank" rel="noopener" data-leave data-title="${esc(first.title)}" data-thumb="${thumb(first.id)}"` : `button data-i="0"`} class="hl-feature">
          <img src="${thumb(first.id, "maxresdefault")}" ${fallback} alt="">
          <span class="hl-shade" aria-hidden="true"></span>
          <span class="g-play" aria-hidden="true"></span>
          <span class="hl-meta">
            <i>${esc(KIND[first.kind] || "Vídeo")} · Etapa ${esc(cur.r)}</i>
            <b>${esc(cur.gp)}</b>
            <small>Vitória de ${esc(cur.winner)}${team ? ` · ${esc(team.name)}` : ""} · ${esc(cur.date)}</small>
          </span>
          ${first.ext ? `<span class="g-ext hl-ext">Assistir no YouTube ↗</span>` : ""}
        </${first.ext ? "a" : "button"}>` : ""}
        ${rest.length ? `<div class="hl-grid">${rest.map((x, k) => tile(x, k + (first ? 1 : 0), h)).join("")}</div>` : ""}`;
      const nOff = h.videos.length;
      $("#hlNote").textContent = [
        nOff && `${nOff} ${nOff > 1 ? "vídeos oficiais" : "vídeo oficial"}`,
        h.photos?.length && `${h.photos.length} ${h.photos.length > 1 ? "fotos" : "foto"} da Wikimedia Commons`,
      ].filter(Boolean).join(" · ") + (h.videos.some(v => v.ext) ? ". Os marcados com “Só no YouTube” abrem no YouTube, porque o canal bloqueia a exibição em outros sites." : ".");
    };
    function tile(x, i) {
      if (x.t === "p") return `
        <button class="g-tile hl-photo" data-i="${i}">
          <span class="g-thumb"><img src="${x.thumb}" alt="" loading="lazy"></span>
          <span class="g-cap"><b>${esc(x.title)}</b><small>Foto · ${esc(x.credit)}</small></span>
        </button>`;
      const v = H[S.id][cur.r].videos.find(y => y.id === x.id);
      const label = KIND[v.kind] || "Vídeo";
      const sub = `Vídeo oficial · ${v.ch}`;
      return v.ext ? `
        <a class="g-tile is-ext" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener" data-leave data-title="${esc(v.title)}" data-thumb="${thumb(v.id)}">
          <span class="g-thumb"><img src="${thumb(v.id)}" alt="" loading="lazy"><span class="g-play" aria-hidden="true"></span><span class="g-ext">Só no YouTube ↗</span></span>
          <span class="g-cap"><b>${esc(v.title)}</b><small>${esc(KIND[v.kind] || "Vídeo")} · ${esc(v.ch)} · abre no YouTube</small></span>
        </a>` : `
        <button class="g-tile" data-i="${i}">
          <span class="g-thumb"><img src="${thumb(v.id)}" alt="" loading="lazy"><span class="g-play" aria-hidden="true"></span><span class="g-badge hl-kind">${esc(label)}</span></span>
          <span class="g-cap"><b>${esc(v.title)}</b><small>${esc(sub)}</small></span>
        </button>`;
    }
    draw();

    $("#hlRaces").addEventListener("click", e => {
      const b = e.target.closest("[data-r]");
      if (!b) return;
      cur = races.find(r => String(r.r) === b.dataset.r);
      $("#hlRaces").querySelectorAll("button").forEach(x => x.setAttribute("aria-selected", x === b));
      draw();
    });
    $("#hlStage").addEventListener("click", e => {
      const b = e.target.closest("[data-i]");
      if (!b) return;
      open(S.id, cur.r, +b.dataset.i);
    });
    // links do calendário escolhem a etapa sem recarregar a página
    document.addEventListener("click", e => {
      const a = e.target.closest("a[data-hl]");
      if (!a) return;
      const b = $(`#hlRaces [data-r="${a.dataset.hl}"]`);
      if (b) { b.click(); b.scrollIntoView({ block: "nearest", inline: "center" }); }
    });
    return true;
  }

  /* ---------- lobby: o último destaque de cada campeonato ---------- */
  function lobbySection() {
    const cards = ORDER.filter(id => !SERIES[id].seasonOver).map(id => {
      const r = racesWith(id)[0];
      const v = r && ordered(H[id][r.r])[0];
      return r && v ? { s: SERIES[id], r, v } : null;
    }).filter(Boolean).sort((a, b) => raceDate(b.r) - raceDate(a.r));
    if (!cards.length) return "";
    return `
      <section class="lobby-hl" aria-labelledby="lhl-title">
        <div class="section-head"><h2 id="lhl-title">Momentos épicos</h2><p>Os melhores momentos da última corrida de cada campeonato, com os vídeos oficiais.</p></div>
        <div class="lhl-grid">${cards.map(({ s, r, v }) => `
          <article class="lhl-card" style="--c:${s.accent}">
            <${v.ext ? `a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener" data-leave data-title="${esc(v.title)}" data-thumb="${thumb(v.id)}"` : `button data-hls="${s.id}" data-hlr="${r.r}"`} class="lhl-media" aria-label="Assistir: ${esc(KIND[v.kind] || "vídeo")} de ${esc(s.short)} ${esc(r.gp)}${v.ext ? " (abre no YouTube)" : ""}">
              <img src="${thumb(v.id, "maxresdefault")}" ${fallback} alt="" loading="lazy">
              <span class="g-play" aria-hidden="true"></span>
              <span class="lhl-badge">${esc(s.short)}</span>
              ${v.ext ? `<span class="g-ext">No YouTube ↗</span>` : ""}
            </${v.ext ? "a" : "button"}>
            <div class="lhl-body">
              <small>Etapa ${esc(r.r)} · ${esc(r.date)}</small>
              <b>${esc(r.gp)}</b>
              <span>Vitória de ${esc(r.winner)}</span>
              <a href="?c=${s.id}&r=${r.r}#destaques">Todos os destaques ›</a>
            </div>
          </article>`).join("")}
        </div>
      </section>`;
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-hls]");
    if (!b) return;
    open(b.dataset.hls, b.dataset.hlr, 0);
  });

  const has = (sid, round) => !!(H[sid]?.[round]?.videos.length || H[sid]?.[round]?.photos?.length);
  return { seriesSection, lobbySection, has, KIND };
})();
