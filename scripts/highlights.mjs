// Pitstop · destaques de cada corrida: vídeos oficiais e fotos livres.
// Roda de hora em hora no GitHub Actions (junto com update-data.mjs) e grava data/highlights.js.
//
// Vídeos: feeds RSS dos canais oficiais no YouTube (não precisam de chave). O feed mostra só os
// ~15 envios mais recentes, então o robô vai acumulando: o que já foi encontrado fica guardado.
// Para preencher o passado de uma vez: node scripts/highlights.mjs --tsv f1=lista.tsv ...
// (arquivos "id<TAB>título", por exemplo gerados com yt-dlp --flat-playlist).
//
// Criadores: além dos canais oficiais, entram vídeos de uma lista fechada de canais confiáveis (moderação por
// lista), só os ligados a uma etapa pelo título e pela data. scripts/moderation.json bloqueia vídeos ou canais.
//
// Fotos: categorias da temporada na Wikimedia Commons (licença livre, com autor). Elas costumam
// aparecer dias depois da corrida, então cada etapa é consultada de novo por até 30 dias.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(ROOT, "data", "highlights.js");
const UA = { "User-Agent": "PitstopFanSite/1.0 (+https://wagnersariolli.github.io/pitstop/)" };
const SEASON = 2026;
const MAX_VIDEOS = 6, MAX_PHOTOS = 8;

/* ---------- dados do site ---------- */
const ctx = { window: {}, SERIES: {} };
ctx.window.SERIES = ctx.SERIES;
vm.createContext(ctx);
for (const f of ["f1", "formulae", "motogp", "wec", "live"]) {
  const file = path.join(ROOT, "data", `${f}.js`);
  if (existsSync(file)) vm.runInContext(readFileSync(file, "utf8"), ctx);
}
const SERIES = ctx.SERIES;
for (const [id, live] of Object.entries(ctx.window.LIVE || {})) {
  if (!SERIES[id] || !live?.calendar) continue;
  for (const [r, x] of Object.entries(live.calendar)) Object.assign(SERIES[id].calendar.find(c => String(c.r) === r) || {}, x);
}

const store = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8").match(/window\.HIGHLIGHTS = (\{[\s\S]*\});/)[1]) : {};

/* ======================================================================
   Como reconhecer cada etapa nos títulos dos vídeos e nas categorias da Commons
   ====================================================================== */
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// [padrão no título, categoria da Commons]
const NAMES = {
  f1: [["Australian", "2026 Australian Grand Prix"], ["Chinese", "2026 Chinese Grand Prix"], ["Japanese", "2026 Japanese Grand Prix"],
    ["Miami", "2026 Miami Grand Prix"], ["Canadian", "2026 Canadian Grand Prix"], ["Monaco", "2026 Monaco Grand Prix"],
    ["Barcelona-Catalunya", "2026 Barcelona-Catalunya Grand Prix"], ["Austrian", "2026 Austrian Grand Prix"], ["British", "2026 British Grand Prix"],
    ["Belgi(?:an|um)", "2026 Belgian Grand Prix"], ["Hungarian", "2026 Hungarian Grand Prix"], ["Dutch", "2026 Dutch Grand Prix"],
    ["Italian", "2026 Italian Grand Prix"], ["Spanish", "2026 Spanish Grand Prix"], ["Azerbaijan", "2026 Azerbaijan Grand Prix"],
    ["Bahrain", "2026 Bahrain Grand Prix"], ["Singapore", "2026 Singapore Grand Prix"], ["United States", "2026 United States Grand Prix"],
    ["Mexico City", "2026 Mexico City Grand Prix"], ["S[ãa]o Paulo", "2026 São Paulo Grand Prix"], ["Las Vegas", "2026 Las Vegas Grand Prix"],
    ["Qatar", "2026 Qatar Grand Prix"], ["Abu Dhabi", "2026 Abu Dhabi Grand Prix"]],
  motogp: [["Thai(?:land)?", "2026 Thailand motorcycle Grand Prix"], ["Brazil(?:ian)?", "2026 Brazilian motorcycle Grand Prix"],
    ["(?:US|Americas)", "2026 Motorcycle Grand Prix of the Americas"], ["Spanish", "2026 Spanish motorcycle Grand Prix"],
    ["French", "2026 French motorcycle Grand Prix"], ["Catalan", "2026 Catalan motorcycle Grand Prix"], ["Italian", "2026 Italian motorcycle Grand Prix"],
    ["Hungarian", "2026 Hungarian motorcycle Grand Prix"], ["Czech", "2026 Czech Republic motorcycle Grand Prix"], ["Dutch", "2026 Dutch TT"],
    ["German", "2026 German motorcycle Grand Prix"], ["British", "2026 British motorcycle Grand Prix"], ["Arag[oó]n", "2026 Aragon motorcycle Grand Prix"],
    ["San Marino", "2026 San Marino motorcycle Grand Prix"], ["Austrian", "2026 Austrian motorcycle Grand Prix"], ["Japanese", "2026 Japanese motorcycle Grand Prix"],
    ["Indonesian", "2026 Indonesian motorcycle Grand Prix"], ["Australian", "2026 Australian motorcycle Grand Prix"],
    ["Malaysian", "2026 Malaysian motorcycle Grand Prix"], ["Qatar", "2026 Qatar motorcycle Grand Prix"],
    ["Portuguese", "2026 Portuguese motorcycle Grand Prix"], ["Valencia(?:n)?", "2026 Valencian Community motorcycle Grand Prix"]],
  wec: [["Imola", "2026 6 Hours of Imola"], ["Spa", "2026 6 Hours of Spa-Francorchamps"], ["Le Mans", "2026 24 Hours of Le Mans"],
    ["S[ãa]o Paulo", "2026 6 Hours of São Paulo"], ["(?:COTA|Lone Star)", "2026 Lone Star Le Mans"], ["Fuji", "2026 6 Hours of Fuji"],
    ["Barcelona", "2026 6 Hours of Barcelona"], ["Monza", "2026 6 Hours of Monza"]],
  // Fórmula E: [ano no título, cidade]. Rodadas duplas se separam pelo "Round N" do título.
  formulae: [["2025", "S[ãa]o Paulo"], ["2026", "Mexico City"], ["2026", "Miami"], ["2026", "Jeddah"], ["2026", "Jeddah"], ["2026", "Madrid"],
    ["2026", "Berlin"], ["2026", "Berlin"], ["2026", "Monaco"], ["2026", "Monaco"], ["2026", "Sanya"], ["2026", "Shanghai"], ["2026", "Shanghai"],
    ["2026", "Tokyo"], ["2026", "Tokyo"], ["2026", "London"], ["2026", "London"]],
};
const CHANNELS = { f1: "UCB_qr75-ydFVKSF9Dmo6izg", formulae: "UC-DuRqsBQOEk_5o1q4Ze-Fg", motogp: "UC8pYaQzbBBXg9GIOHRvTmDQ", wec: "UCwU7U7PiarcJKLjDJTnANjw" };
const CHANNEL_NAME = { f1: "FORMULA 1", formulae: "Formula E", motogp: "MotoGP", wec: "FIA WEC" };
// o canal da F1 bloqueia a exibição dos vídeos fora do YouTube (erro 150 do player, testado em out/2026): abrem lá
const CHANNEL_EXT = { f1: true };

/* ---------- criadores: canais confiáveis (moderação por lista) ---------- */
const CREATORS = [
  { ch: "UCepUf0u6f8JS3yq4NPXHW3g", name: "Flavio Gomes", lang: "pt", series: ["f1"] },
  { ch: "UCvm40-L5lbzlxQSbVnfX8pQ", name: "Motorsport Brasil", lang: "pt", series: ["f1", "motogp"] },
  { ch: "UC9OlHEgxoaY6QY6nWPoiqQg", name: "Grande Prêmio", lang: "pt", series: ["f1", "motogp", "wec", "formulae"] },
  { ch: "UCaTxfj0BzL-MaCy-YUqPRoQ", name: "The Race", lang: "en", series: ["f1"] },
  { ch: "UC2Wp_LL33dbMKBOZtuXPPhA", name: "The Race MotoGP", lang: "en", series: ["motogp"] },
  { ch: "UCPwy2q7BNjdLYu1kM_OEJVw", name: "Peter Windsor", lang: "en", series: ["f1"] },
  { ch: "UC3kxJQ9RfaS5CKeYbbFMi4Q", name: "Sky Sports F1", lang: "en", series: ["f1"] },
];
// fora: transmissões ao vivo, corridas inteiras republicadas, jogos, podcasts longos e assuntos que não são a corrida
const CREATOR_SKIP = /(ao vivo|\blive\b|livestream|#shorts|\bshorts?\b|complet[oa]\b|full race|watchalong|podcast|\bf1 2\d\b|simulador|sim racing|gameplay|merdinhas|\bbets?\b|preview|pr[ée]via|antevis[aã]o|friday|sexta|treino livre|\bfp[123]\b|qualifying|classifica[cç][aã]o|quali\b)/i;
const CREATOR_SKIP_MORE = /(members'? video|membros|audio version|vers[aã]o em [aá]udio|camchat)/i;
// a categoria pelo título: um vídeo que fala de outra categoria não entra só porque a pista tem o mesmo nome
const SERIES_WORDS = {
  f1: /\b(f-?1|f[oó]rmula 1|formula one|grand prix|\bgp\b)/i,
  formulae: /(f[oó]rmula e\b|e-?prix|\bep\b)/i,
  motogp: /(motogp|moto ?gp)/i,
  wec: /(\bwec\b|horas de|hours of|hypercar|le mans)/i,
};
const OTHER_SERIES = /(\belms\b|gtwc|gt world|stock car|indy|nascar|wsbk|superbike|mxgp|imsa|\bf2\b|\bf3\b|porsche cup|turismo|dtm|rally|wrc|kart)/i;
const MAX_CREATORS = 4, MAX_PER_CHANNEL = 2;
const MOD = (() => { const f = path.join(ROOT, "scripts", "moderation.json"); return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : {}; })();
const blockedVideo = new Set(MOD.blockVideos || []), blockedChannel = new Set(MOD.blockChannels || []);
const fold = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const STOP = new Set(["grande", "premio", "horas", "circuito", "circuit", "internacional", "international", "autodromo", "street", "park", "ring"]);
// palavras que identificam a etapa: nome do GP, circuito e cidade (em português) + o padrão em inglês
function raceWords(id, r) {
  const words = new Set(fold(`${r.gp} ${r.circuit}`).split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !STOP.has(w)));
  const en = id === "formulae" ? NAMES.formulae[r.r - 1]?.[1] : NAMES[id]?.[r.r - 1]?.[0];
  return { words: [...words], en: en ? new RegExp(`\\b(${en})\\b`, "i") : null };
}
const dayOf = r => { const m = String(r.date).match(/(\d{1,2})\s+([a-z]{3})/i); const M = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 }; return m ? Date.UTC(SEASON, M[m[2].toLowerCase()], +m[1]) : NaN; };
function matchCreator(cr, v) {
  if (blockedVideo.has(v.id) || blockedChannel.has(cr.ch) || CREATOR_SKIP.test(v.title) || CREATOR_SKIP_MORE.test(v.title)) return null;
  const t = fold(v.title), pub = Date.parse(v.published);
  if (!pub) return null;
  // datas aproximadas (preenchimento do passado) ganham mais folga
  const slack = v.approx ? Math.max(5, (Date.now() - pub) / 864e5 * 0.15) : 0;
  for (const id of cr.series) {
    const s = SERIES[id];
    if (!s) continue;
    // fala de outra categoria (e não desta)? fica de fora
    const others = Object.entries(SERIES_WORDS).filter(([k]) => k !== id).some(([, re]) => re.test(v.title)) || OTHER_SERIES.test(v.title);
    if (others && !SERIES_WORDS[id].test(v.title)) continue;
    // canais que cobrem várias categorias precisam dizer qual é no título
    if (cr.series.length > 1 && !SERIES_WORDS[id].test(v.title) && id !== "f1") continue;
    for (const r of s.calendar.filter(x => x.winner)) {
      const d = dayOf(r), after = (pub - d) / 864e5;
      if (after < -1 - slack || after > 5 + slack) continue;
      const { words, en } = raceWords(id, r);
      if (words.some(w => new RegExp(`\\b${w}\\b`).test(t)) || (en && en.test(v.title))) return { id, round: r.r };
    }
  }
  return null;
}
async function creatorFeed(cr) {
  const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${cr.ch}`, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`RSS ${cr.name}: ${r.status}`);
  const xml = await r.text();
  const un = s => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  return [...xml.matchAll(/<yt:videoId>(.*?)<\/yt:videoId>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<published>(.*?)<\/published>/g)]
    .map(m => ({ id: m[1], title: un(m[2]), published: m[3] }));
}
// preenchimento do passado: arquivos "id<TAB>aaaammdd<TAB>título" por canal, em --creators=pasta
const creatorsDir = (process.argv.find(a => a.startsWith("--creators=")) || "").split("=")[1];
const creatorTsv = cr => {
  const f = creatorsDir && path.join(creatorsDir, `${cr.ch}.tsv`);
  if (!f || !existsSync(f)) return [];
  return readFileSync(f, "utf8").split(/\r?\n/).filter(Boolean).map(l => {
    const [id, d, ...t] = l.split("\t");
    return /^\d{8}$/.test(d) ? { id, title: t.join("\t"), published: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}T12:00:00Z`, approx: true } : null;
  }).filter(Boolean);
};

// tipo de vídeo → prioridade (menor aparece antes). A ordem importa: o primeiro padrão que casar define o tipo.
const KINDS = [
  ["react", /drivers?'? react(?! after (qualifying|sprint))/i, 8],
  ["extended", /extended highlights/i, 3],
  ["overtakes", /overtake highlights|best overtakes|overtakes and battles/i, 5],
  ["qualifying", /qualifying|hyperpole|pole lap|pole position|ghost car|last 5 min[^|]*(Q2|practice)|\bQ2\b/i, 9],
  ["onboard", /onboard/i, 5],
  ["sprint", /sprint/i, 6],
  ["race", /race highlights|motogp highlights|round \d+ highlights|^highlights\b/i, 1],
  ["moments", /best motogp\S* moments|dramatic|unforgettable moments|top \d+ [^|]*moments|best night racing/i, 2],
  ["replay", /full race/i, 6],
  ["start", /race start|lights out/i, 5],
  ["radio", /radio/i, 7],
];
const SKIP = {
  f1: /\b(FP[123]|practice|F2|F3|F1 Academy|preview|podcast|analysis|behind the scenes|press conference|track guide|explained|sprint qualifying|warm-up|look ahead|looks ahead|grid gigs|friday|full onboard lap)\b/i,
  motogp: /\b(Moto2|Moto3|MotoE|Rookies|Workshop|preview|press conference|what we learned)\b/i,
  wec: /\b(onboard lap|preview|free practice|FP\d|prologue|interview|press conference)\b/i,
  formulae: /\b(preview|interview|press conference|practice|FP\d|testing)\b/i,
};

function classify(id, title) {
  const s = SERIES[id];
  if (!s || SKIP[id].test(title)) return null;
  let round = null;
  if (id === "formulae") {
    const rn = title.match(/\bR(?:ound)?\s?(\d{1,2})\b/i);
    NAMES.formulae.forEach(([year, place], i) => {
      if (round || !title.includes(year) || !new RegExp(`${place}[^|]*E-?Prix|E-?Prix[^|]*${place}`, "i").test(title)) return;
      const doubles = NAMES.formulae.filter(([, p]) => p === place).length > 1;
      if (rn) { if (+rn[1] === i + 1) round = i + 1; } else if (!doubles) round = i + 1;
    });
  } else {
    NAMES[id].forEach(([pat], i) => {
      if (round) return;
      const re = id === "wec" ? new RegExp(`\\b${pat}\\b[^|]*${SEASON}|${SEASON}[^|]*\\b${pat}\\b`, "i")
        : id === "motogp" ? new RegExp(`${SEASON} ${pat} GP\\b`, "i")
        : new RegExp(`${SEASON} ${pat}[^|]*(Grand Prix|GP)\\b`, "i");
      if (re.test(title)) round = i + 1;
    });
  }
  if (!round) return null;
  const race = s.calendar.find(c => c.r === round);
  if (!race) return null;
  const [kind, , prio] = KINDS.find(([, re]) => re.test(title)) || ["epic", null, 4];
  const clean = title.replace(/\s*\|\s*(FIA WEC|Formula E|Qatar Airways|Lenovo|Crypto\.com|Heineken|MSC Cruises|Aramco)\s*$/i, "").replace(/\s+/g, " ").trim();
  return { round, kind, prio, title: clean };
}

/* ---------- fontes de vídeos ---------- */
async function rss(id) {
  const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNELS[id]}`, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`RSS ${id}: ${r.status}`);
  const xml = await r.text();
  const unescape = s => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  return [...xml.matchAll(/<yt:videoId>(.*?)<\/yt:videoId>[\s\S]*?<title>(.*?)<\/title>/g)].map(m => ({ id: m[1], title: unescape(m[2]) }));
}
const tsvArgs = Object.fromEntries(process.argv.slice(2).filter(a => a.includes("=") && !a.startsWith("--")).map(a => a.split("=")));
const fromTsv = id => tsvArgs[id] ? readFileSync(tsvArgs[id], "utf8").split(/\r?\n/).filter(Boolean).map(l => { const [vid, ...t] = l.split("\t"); return { id: vid, title: t.join("\t") }; }) : [];

/* ---------- fotos (Wikimedia Commons) ---------- */
async function commons(category) {
  const api = "https://commons.wikimedia.org/w/api.php?format=json&";
  const files = new Set();
  const cats = [category];
  try {
    const sub = await (await fetch(`${api}action=query&list=categorymembers&cmtype=subcat&cmlimit=20&cmtitle=${encodeURIComponent("Category:" + category)}`, { headers: UA })).json();
    for (const c of sub.query?.categorymembers || []) cats.push(c.title.replace(/^Category:/, ""));
  } catch (e) { /* sem subcategorias */ }
  for (const c of cats.slice(0, 6)) {
    const j = await (await fetch(`${api}action=query&generator=categorymembers&gcmtype=file&gcmlimit=80&gcmtitle=${encodeURIComponent("Category:" + c)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1920`, { headers: UA })).json();
    for (const p of Object.values(j.query?.pages || {})) {
      const ii = p.imageinfo?.[0], m = ii?.extmetadata || {};
      const lic = m.LicenseShortName?.value || "";
      if (!ii || !/\.(jpe?g)$/i.test(p.title) || ii.width < 1200 || ii.width < ii.height * 1.2) continue;
      if (!/CC|Public domain|PD/i.test(lic)) continue;
      const author = (m.Artist?.value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 60) || "Wikimedia Commons";
      const src = (ii.thumburl || ii.url).split("?")[0];
      files.add(JSON.stringify({
        src, thumb: src.replace(/\/\d+px-/, "/500px-"),
        title: p.title.replace(/^File:/, "").replace(/\.(jpe?g)$/i, "").replace(/[_\s]+/g, " ").replace(/\s*\(\d{6,}\)$/, ""),
        credit: `${author} · ${lic}`, link: ii.descriptionurl,
      }));
    }
    await new Promise(r => setTimeout(r, 400));
  }
  return [...files].map(x => JSON.parse(x)).slice(0, MAX_PHOTOS);
}

/* ======================================================================
   Execução
   ====================================================================== */
const report = [];
let changed = false;
for (const id of ["f1", "formulae", "motogp", "wec"]) {
  const s = SERIES[id];
  const bucket = store[id] ||= {};
  let list = fromTsv(id);
  if (!s.seasonOver) {
    try { list = list.concat(await rss(id)); } catch (e) { report.push(`${id}: feed indisponível (${e.message})`); }
  }
  let added = 0;
  for (const v of list) {
    const hit = classify(id, v.title);
    if (!hit) continue;
    const race = bucket[hit.round] ||= { videos: [], photos: [] };
    if (race.videos.some(x => x.id === v.id)) continue;
    race.videos.push({ id: v.id, kind: hit.kind, prio: hit.prio, title: hit.title, ch: CHANNEL_NAME[id], ...(CHANNEL_EXT[id] ? { ext: true } : {}) });
    race.videos.sort((a, b) => a.prio - b.prio);
    const official = race.videos.filter(x => x.kind !== "creator").slice(0, MAX_VIDEOS);
    race.videos = [...official, ...race.videos.filter(x => x.kind === "creator")].sort((a, b) => a.prio - b.prio);
    if (race.videos.some(x => x.id === v.id)) { added++; changed = true; }
  }

  // fotos: etapas já disputadas, consultadas de novo uma vez por dia por até 30 dias
  let photosAdded = 0;
  for (const race of s.calendar.filter(r => r.winner)) {
    const name = id === "formulae" ? null : NAMES[id][race.r - 1]?.[1];
    if (!name) continue;
    const b = bucket[race.r] ||= { videos: [], photos: [] };
    const checked = b.photosChecked ? Date.parse(b.photosChecked) : 0;
    const raceDay = (() => { const m = String(race.date).match(/(\d{1,2})\s+([a-z]{3})/i); const M = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 }; return m ? Date.UTC(SEASON, M[m[2].toLowerCase()], +m[1]) : 0; })();
    const fresh = Date.now() - raceDay < 30 * 864e5;
    if (checked && (!fresh || Date.now() - checked < 864e5)) continue;
    try {
      const photos = await commons(name);
      if (photos.length > (b.photos?.length || 0)) { b.photos = photos; photosAdded += photos.length; changed = true; }
      b.photosChecked = new Date().toISOString();
      changed = true;
    } catch (e) { report.push(`${id} etapa ${race.r}: Commons falhou (${e.message})`); }
  }
  const rounds = Object.keys(bucket).length;
  report.push(`${id}: ${added} vídeo(s) novo(s), ${photosAdded} foto(s) nova(s); ${rounds} etapa(s) com destaques`);
}

/* ---------- vídeos dos criadores ---------- */
let creatorsAdded = 0;
for (const cr of CREATORS) {
  let list = creatorTsv(cr);
  try { list = list.concat(await creatorFeed(cr)); } catch (e) { report.push(`${cr.name}: feed indisponível (${e.message})`); }
  for (const v of list) {
    const hit = matchCreator(cr, v);
    if (!hit) continue;
    const race = (store[hit.id] ||= {})[hit.round] ||= { videos: [], photos: [] };
    if (race.videos.some(x => x.id === v.id)) continue;
    const mine = race.videos.filter(x => x.kind === "creator");
    if (mine.filter(x => x.chId === cr.ch).length >= MAX_PER_CHANNEL) continue;
    const item = { id: v.id, kind: "creator", prio: cr.lang === "pt" ? 3 : 3.5, title: v.title.trim(), ch: cr.name, chId: cr.ch, lang: cr.lang };
    if (mine.length >= MAX_CREATORS) {
      // lista cheia: só entra se for em português no lugar de um em inglês
      const en = mine.find(x => x.lang !== "pt");
      if (cr.lang !== "pt" || !en) continue;
      race.videos.splice(race.videos.indexOf(en), 1);
    }
    race.videos.push(item);
    race.videos.sort((a, b) => a.prio - b.prio);
    creatorsAdded++; changed = true;
  }
}
// moderação também vale para o que já estava guardado
for (const bucket of Object.values(store)) for (const race of Object.values(bucket)) {
  const before = race.videos.length;
  race.videos = race.videos.filter(v => !blockedVideo.has(v.id) && !blockedChannel.has(v.chId));
  if (race.videos.length !== before) changed = true;
}
report.push(`criadores: ${creatorsAdded} vídeo(s) novo(s)`);

if (changed) {
  writeFileSync(FILE, "// Gerado automaticamente por scripts/highlights.mjs. Não edite à mão.\n" +
    `window.HIGHLIGHTS = ${JSON.stringify(store, null, 1)};\n`);
  report.push("data/highlights.js atualizado");
} else report.push("sem mudanças");
console.log(report.join("\n"));
