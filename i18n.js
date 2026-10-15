// Pitstop · idioma (português ou inglês).
// Carregado no <head>, antes de tudo: decide o idioma, marca o <html lang> e oferece:
//   I18N.T(pt, en)      → o texto no idioma atual (usado direto no código de app.js, guide.js e destaques.js)
//   I18N.term(texto)    → países, cidades, rótulos de ficha e outros termos curtos que se repetem nos dados
//   I18N.localize()     → aplica por cima de SERIES, MEDIA e CIRCUITS o conteúdo em inglês de data/en/*.js
//   I18N.applyStatic()  → traduz o HTML fixo marcado com data-i18n, data-i18n-html, data-i18n-aria-label…
// O português é a base e a fonte de verdade: tudo que não tem tradução aparece como está.
window.I18N = (() => {
  // a escolha do visitante (?lang= no endereço ou a chave PT/EN); na primeira visita, o idioma do navegador
  // (português para qualquer pt-*, inglês para o resto), como no portfólio
  const pick = () => {
    const q = typeof location !== "undefined" ? new URLSearchParams(location.search).get("lang") : null;
    if (q === "en" || q === "pt") { try { localStorage.setItem("lang", q); } catch (e) { /* sem armazenamento */ } return q; }
    let saved = null;
    try { saved = localStorage.getItem("lang"); } catch (e) { /* sem armazenamento */ }
    if (saved === "en" || saved === "pt") return saved;
    const nav = typeof navigator !== "undefined" ? (navigator.languages?.length ? navigator.languages : [navigator.language || "pt"]) : ["pt"];
    return nav.some(l => /^pt(-|$)/i.test(l)) ? "pt" : "en";
  };
  const lang = typeof window.__LANG === "string" ? window.__LANG : pick();
  const en = lang === "en";
  const locale = en ? "en-GB" : "pt-BR";
  if (typeof document !== "undefined") document.documentElement.lang = en ? "en" : "pt-BR";

  const T = (pt, eng) => (en ? eng : pt);

  /* ---------- Termos curtos que se repetem nos dados ---------- */
  const TERMS = {
    // países
    "Alemanha": "Germany", "Andorra": "Andorra", "Arábia Saudita": "Saudi Arabia", "Argentina": "Argentina", "Austrália": "Australia",
    "Áustria": "Austria", "Azerbaijão": "Azerbaijan", "Bahrein": "Bahrain", "Barbados": "Barbados", "Bélgica": "Belgium", "Brasil": "Brazil",
    "Canadá": "Canada", "Catar": "Qatar", "China": "China", "Coreia do Sul": "South Korea", "Dinamarca": "Denmark",
    "Emirados Árabes": "United Arab Emirates", "Espanha": "Spain", "EUA": "USA", "Estados Unidos": "United States", "Finlândia": "Finland",
    "França": "France", "Grã-Bretanha": "Great Britain", "Holanda": "Netherlands", "Hungria": "Hungary", "Indonésia": "Indonesia",
    "Itália": "Italy", "Japão": "Japan", "Malásia": "Malaysia", "México": "Mexico", "Mônaco": "Monaco", "Nova Zelândia": "New Zealand",
    "Polônia": "Poland", "Portugal": "Portugal", "Reino Unido": "United Kingdom", "República Tcheca": "Czech Republic",
    "Singapura": "Singapore", "Suécia": "Sweden", "Suíça": "Switzerland", "Tailândia": "Thailand", "Turquia": "Turkey",
    "África do Sul": "South Africa",
    // regiões, cidades e etapas
    "Aragão": "Aragon", "Catalunha": "Catalonia", "Valência": "Valencia", "Barcelona-Catalunha": "Barcelona-Catalunya",
    "Berlim": "Berlin", "Bolonha": "Bologna", "Cidade do México": "Mexico City", "Colônia": "Cologne", "Londres": "London",
    "Madri": "Madrid", "Múrcia": "Murcia", "Roma": "Rome", "Turim": "Turin", "Tóquio": "Tokyo", "Xangai": "Shanghai",
    "Ímola": "Imola", "Circuito das Américas": "Circuit of the Americas",
    // rótulos das fichas
    "Chassi": "Chassis", "Unidade de potência": "Power unit", "Sede": "Headquarters", "Chefe de equipe": "Team principal",
    "Na F1 desde": "In F1 since", "Títulos de construtores": "Constructors' titles", "Carro": "Car", "Powertrain": "Powertrain",
    "Vitórias na temporada": "Wins this season", "Moto": "Bike", "Fabricante": "Manufacturer", "Motor": "Engine",
    "Categoria": "Category", "Base": "Base", "Largadas na carreira": "Career starts", "Vitórias na carreira": "Career wins",
    "Pódios na carreira": "Career podiums", "Pódios em 2026": "Podiums in 2026", "Pilotos": "Drivers", "Países": "Countries",
    // ângulos das fotos e abas da classificação
    "Lateral direita": "Right side", "Lateral esquerda": "Left side", "Frente": "Front", "Traseira": "Rear",
    "Vista de cima": "Top view", "Três quartos": "Three-quarter view",
    "Construtores": "Constructors", "Equipes": "Teams", "Fabricantes": "Manufacturers",
    // números do destaque do líder (o robô de data/live.js escreve em português)
    "Pontos": "Points", "Vitórias": "Wins", "Vantagem": "Lead", "Pódios": "Podiums",
  };
  const extra = {};          // termos de cada campeonato (data/en/*.js → terms)
  const term = s => {
    if (!en || s == null || typeof s !== "string") return s;
    const hit = extra[s] ?? TERMS[s];
    if (hit != null) return hit;
    if (s.includes(", ")) return s.split(", ").map(term).join(", ");
    if (s.includes(" / ")) return s.split(" / ").map(term).join(" / ");
    const m = s.match(/^(.+) (\d{1,2})$/);                // "Berlim 1" → "Berlin 1"
    if (m && (extra[m[1]] ?? TERMS[m[1]])) return `${term(m[1])} ${m[2]}`;
    return s;
  };

  // datas dos dados ("08 mar") → "8 Mar"; raceDate() em app.js entende os dois formatos
  const MON = { jan: "Jan", fev: "Feb", mar: "Mar", abr: "Apr", mai: "May", jun: "Jun", jul: "Jul", ago: "Aug", set: "Sep", out: "Oct", nov: "Nov", dez: "Dec" };
  const date = s => (!en || typeof s !== "string" ? s : s.replace(/^(\d{1,2})\s+([a-z]{3})$/i, (_, d, m) => `${+d} ${MON[m.toLowerCase()] || m}`));

  const ordinal = n => {
    if (!en) return `${n}º`;
    const k = n % 100;
    return `${n}${k >= 11 && k <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
  };

  /* ---------- Conteúdo em inglês por cima dos dados em português ---------- */
  const isObj = x => x && typeof x === "object" && !Array.isArray(x);
  function merge(base, over) {
    for (const [k, v] of Object.entries(over)) {
      if (isObj(v) && isObj(base[k])) merge(base[k], v);
      else base[k] = v;
    }
    return base;
  }
  // itens de lista (equipes, pilotos, etapas) casam pelo id, número ou rodada
  function mergeList(list, over, key) {
    if (!over) return;
    for (const item of list) { const o = over[item[key]]; if (o) merge(item, o); }
  }

  function localizeSeries(s, o = {}) {
    Object.assign(extra, o.terms || {});
    const { teams, drivers, calendar, standings, team, driver, terms, ...rest } = o;
    for (const t of s.teams) {
      t.specs = t.specs?.map(([k, v]) => [term(k), typeof v === "string" ? term(v) : v]);
      t.views = t.views?.map(v => ({ ...v, label: term(v.label) }));
      if (team) merge(t, team(t));
    }
    mergeList(s.teams, teams, "id");
    for (const d of s.drivers) {
      d.country = term(d.country);
      d.place = term(d.place);
      d.extra = d.extra?.map(([k, v]) => [term(k), typeof v === "string" ? term(v) : v]);
      if (driver) merge(d, driver(d));
    }
    mergeList(s.drivers, drivers, "n");
    for (const r of s.calendar) {
      r.gp = term(r.gp); r.circuit = term(r.circuit); r.date = date(r.date);
      if (r.pill) r.pill = term(r.pill);
    }
    mergeList(s.calendar, calendar, "r");
    (s.standings || []).forEach((tab, i) => {
      tab.label = term(tab.label);
      tab.rows.forEach(r => { if (r.sub) r.sub = term(r.sub); });
      if (standings?.[i]) merge(tab, standings[i]);
    });
    merge(s, rest);
  }

  function localize() {
    if (!en) return;
    const E = window.EN || {};
    for (const [id, s] of Object.entries(window.SERIES || {})) localizeSeries(s, E[id]);
    // galeria dos veículos: títulos escritos em português (os que vêm do YouTube ou da Commons já estão em inglês)
    const titles = E.media || {};
    for (const s of Object.values(window.MEDIA || {})) for (const list of Object.values(s)) for (const x of list) { if (titles[x.title]) x.title = titles[x.title]; }
    for (const c of Object.values(window.CIRCUITS || {})) {
      c.country = term(c.country); c.city = term(c.city); c.name = term(c.name);
      if (E.circuits?.[c.id]) merge(c, E.circuits[c.id]);
    }
  }

  /* ---------- HTML fixo das páginas ---------- */
  const STATIC = {
    "meta.description": "Cars, drivers, spec sheets, standings, circuit guide and trivia from Formula 1, Formula E, MotoGP and WEC.",
    "brand": "Pitstop, home page",
    "nav.series": "Championships by category",
    "nav.sections": "Sections",
    "garage.teams": "Teams",
    "garage.prev": "Previous team",
    "garage.next": "Next team",
    "garage.angle": "Photo angle",
    "garage.engine": "Hear the engine",
    "gallery": "Gallery",
    "gallery.filter": "Filter gallery",
    "garage.performance": "Performance",
    "garage.performanceSub": "Pitstop estimate, from 0 to 100, based on this season's results",
    "garage.overall": "Overall",
    "garage.specs": "Spec sheet",
    "garage.drivers": "Drivers",
    "hl.title": "Highlights",
    "hl.rounds": "Rounds",
    "season.calendar": "Calendar",
    "facts.title": "Trivia",
    "others.title": "Other championships",
    "footer.privacy": "Privacy",
    "footer.code": "Code on GitHub",
    "close": "Close",
    "prev": "Previous",
    "next": "Next",
    "strip.next": "Up next",
    "strip.prev": "See previous videos",
    "strip.more": "See more videos",
    "lang": "Language / Idioma",
    // 404
    "nf.title": "Page not found · Pitstop",
    "nf.kicker": "Error 404",
    "nf.h1": "Off the track",
    "nf.p": "This page doesn't exist or has moved. Head back to the pits and pick another way.",
    "nf.back": "Back to Pitstop",
    // privacidade
    "pv.title": "Privacy · Pitstop",
    "pv.description": "How Pitstop handles your email and browsing data.",
    "pv.back": "‹ Back to Pitstop",
    "pv.h1": "Privacy",
    "pv.updated": "Updated on 15 October 2026.",
    "pv.intro": "Pitstop is a personal fan project, non-commercial and not affiliated with Formula 1, Formula E, MotoGP, WEC or the teams. This page explains, in plain language, what happens to your data when you use the site and when you subscribe to the newsletter, in line with Brazil's General Data Protection Law (LGPD, Law 13,709/2018).",
    "pv.nl": "Email newsletter",
    "pv.nl1": "<b>What we collect:</b> only the email address you type into the form.",
    "pv.nl2": "<b>What for:</b> sending the Pitstop newsletter, with race results and the weekend schedule. Nothing else: we don't sell or rent your email, and we don't use it for advertising. The newsletter is written in Portuguese.",
    "pv.nl3": "<b>Legal basis:</b> your consent. The subscription only counts after you click the confirmation link sent to that email.",
    "pv.nl4": "<b>Who stores and sends it:</b> the <a href=\"https://buttondown.com/legal/privacy\" rel=\"noopener\">Buttondown</a> service, in the United States, which keeps the list and sends the emails on Pitstop's behalf. That's why your email is stored outside Brazil. Buttondown may record technical delivery data, such as email opens and link clicks, which only show up in statistics.",
    "pv.nl5": "<b>For how long:</b> while you're subscribed. Once you unsubscribe, the emails stop right away.",
    "pv.nl6": "<b>How to leave:</b> every newsletter email has a one-click unsubscribe link.",
    "pv.nl7": "<b>Your rights:</b> you can ask to access, correct or delete your email at any time. Just reply to any newsletter email with the request.",
    "pv.nav": "Browsing the site",
    "pv.nav1": "<b>No tracking cookies and no analytics tools.</b> Pitstop doesn't use Google Analytics, ad pixels or anything similar.",
    "pv.nav2": "<b>Preferences in your browser:</b> the site stores in your own browser (local storage) your language, whether you've already subscribed to the newsletter or dismissed the invitations, so it doesn't keep asking. This information never leaves your device. Clearing the site's data in your browser erases it all.",
    "pv.nav3": "<b>Third-party content:</b> to show photos, videos, fonts and maps, your browser fetches files directly from other services, which receive your IP address as with any access on the internet. They are: Google Fonts (typefaces), formula1.com, fiaformulae.com, motogp.com and fiawec.com (official photos), Wikimedia Commons (circuit photos), YouTube in privacy-enhanced mode (only when you press play) and Esri (maps and satellite imagery).",
    "pv.nav4": "<b>Hosting:</b> the site runs on GitHub Pages, which keeps technical access logs for security, as described in <a href=\"https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement\" rel=\"noopener\">GitHub's policy</a>.",
    "pv.img": "Images and trademarks",
    "pv.img1": "Photos of the cars, drivers and logos belong to the championships and teams and are used only for identification, on a non-profit fan site. Circuit photos come from Wikimedia Commons, with author and licence credited on each one. If you own any of this content and want it removed, open a request in the <a href=\"https://github.com/WagnerSariolli/pitstop/issues\" rel=\"noopener\">project repository</a>.",
    "pv.changes": "Changes",
    "pv.changes1": "If this page changes in any significant way, the date at the top will be updated and newsletter subscribers will be told.",
    "pv.footer": "Pitstop is a fan project, not affiliated with the championships.",
  };
  function applyStatic(root = document) {
    root.querySelectorAll(".lang-btn").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    if (!en) return;
    const get = k => STATIC[k];
    root.querySelectorAll("[data-i18n]").forEach(el => { const v = get(el.dataset.i18n); if (v != null) el.textContent = v; });
    root.querySelectorAll("[data-i18n-html]").forEach(el => { const v = get(el.dataset.i18nHtml); if (v != null) el.innerHTML = v; });
    for (const attr of ["aria-label", "content", "alt", "title"]) {
      root.querySelectorAll(`[data-i18n-${attr}]`).forEach(el => { const v = get(el.getAttribute(`data-i18n-${attr}`)); if (v != null) el.setAttribute(attr, v); });
    }
  }

  /* ---------- Chave PT/EN ---------- */
  // a página é montada uma vez só no carregamento; trocar o idioma recarrega e volta para o mesmo ponto da rolagem
  if (typeof document !== "undefined") {
    document.addEventListener("click", e => {
      const b = e.target.closest?.(".lang-btn");
      if (!b || b.dataset.lang === lang) return;
      // a escolha passa a valer pela chave, não pelo endereço; sem o #seção, para a página não pular para ela
      const url = new URL(location.href);
      url.searchParams.delete("lang");
      url.hash = "";
      try {
        localStorage.setItem("lang", b.dataset.lang);
        sessionStorage.setItem("pitstop-scroll", JSON.stringify({ path: url.pathname + url.search, y: scrollY }));
      } catch (err) { /* sem armazenamento */ }
      if (url.href !== location.href) location.replace(url.href); else location.reload();
    });
    addEventListener("load", () => {
      let saved = null;
      try { saved = JSON.parse(sessionStorage.getItem("pitstop-scroll") || "null"); sessionStorage.removeItem("pitstop-scroll"); } catch (err) { /* sem armazenamento */ }
      if (saved && saved.path === location.pathname + location.search) {
        if ("scrollRestoration" in history) history.scrollRestoration = "manual";
        setTimeout(() => { const l = window.Motion?.lenis; if (l) l.scrollTo(saved.y, { immediate: true }); else scrollTo(0, saved.y); }, 60);
      }
    }, { once: true });
  }

  return { lang, en, locale, T, term, date, ordinal, localize, applyStatic };
})();
