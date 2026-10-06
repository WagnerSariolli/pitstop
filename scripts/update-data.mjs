// Pitstop · atualização automática dos dados da temporada.
// Roda no GitHub Actions (veja .github/workflows/update-data.yml) e grava data/live.js,
// que o site aplica por cima dos dados fixos de data/<campeonato>.js.
//
// Fontes:
//   F1      → API Jolpica-F1 (sucessora da Ergast), api.jolpi.ca
//   MotoGP  → API de resultados do site oficial, api.motogp.pulselive.com
//   WEC     → tabelas de resultados da Wikipedia (o WEC não tem API pública)
//   Fórmula E → temporada encerrada em agosto; nada a buscar até a próxima.
//
// Se uma fonte falhar, o campeonato dela fica com os dados da última execução que deu certo.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const UA = { "User-Agent": "PitstopFanSite/1.0 (+https://wagnersariolli.github.io/pitstop/)" };
const SEASON = 2026;

/* ---------- dados fixos do site (para casar nomes, números e equipes) ---------- */
const ctx = { window: {}, SERIES: {} };
ctx.window.SERIES = ctx.SERIES;
vm.createContext(ctx);
for (const f of ["f1", "formulae", "motogp", "wec"]) vm.runInContext(readFileSync(path.join(ROOT, "data", `${f}.js`), "utf8"), ctx);
const SERIES = ctx.SERIES;

const LIVE_FILE = path.join(ROOT, "data", "live.js");
const previous = (() => {
  if (!existsSync(LIVE_FILE)) return {};
  const m = readFileSync(LIVE_FILE, "utf8").match(/window\.LIVE = (\{[\s\S]*\});/);
  return m ? JSON.parse(m[1]) : {};
})();

/* ---------- utilidades ---------- */
async function get(url, type = "json") {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return type === "json" ? await r.json() : await r.text();
    } catch (e) {
      if (a === 2) throw e;
      await new Promise(res => setTimeout(res, 3000 * (a + 1)));
    }
  }
}
const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const MONTHS = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
const dateOf = r => { const m = String(r.date).match(/(\d{1,2})\s+([a-z]{3})/i); return m ? Date.UTC(SEASON, MONTHS[m[2].toLowerCase()], +m[1]) : NaN; };
const near = (a, b, days = 3) => Math.abs(a - b) <= days * 864e5;
const pts = (n, w = "ponto") => `${n} ${Math.abs(n) === 1 ? w : `${w}s`}`;
// nome curto como no calendário: sobrenome, ou inicial + sobrenome quando dois pilotos têm o mesmo
function shortName(s, d) {
  const twins = s.drivers.filter(x => x.last === d.last).length > 1;
  return twins ? `${d.first[0]}. ${d.last}` : d.last;
}

/** textos que dependem da classificação: só substituem os escritos à mão quando os números mudam */
function narrative(s, live, { leaderName, secondName, heroFrom, statsFor, isCrew = false }) {
  const done = live.round, total = s.calendar.length;
  const rows = live.drivers.filter(d => d.pos).sort((a, b) => a.pos - b.pos);
  const [p1, p2] = rows;
  if (!p1) return {};
  const gap = p1.pts - (p2 ? p2.pts : 0);
  const leader = heroFrom(p1), second = p2 ? heroFrom(p2) : null;
  const stats = statsFor(p1, gap);
  const same = s.hero.number === String(leader.n) && JSON.stringify(s.hero.stats) === JSON.stringify(stats);
  const out = {};
  const over = done >= total;
  out.kicker = over ? `${isCrew ? "Campeões" : "Campeão"} ${s.season}` : `${isCrew ? "Líderes" : "Líder"} do campeonato · após ${done} de ${total} etapas`;
  if (same) return { hero: { kicker: out.kicker } };
  const lead = leaderName(leader), sec = second && secondName(second);
  out.stats = stats;
  out.lede = over
    ? `${lead} ${isCrew ? "conquistaram" : "conquistou"} o título de ${s.season} com ${pts(p1.pts)}${sec ? `, ${pts(gap)} à frente de ${sec}` : ""}.`
    : `${lead} ${isCrew ? "lideram" : "lidera"} o campeonato com ${pts(p1.pts)}${sec ? ` e ${pts(gap)} de vantagem sobre ${sec}` : ""}, depois de ${done} de ${total} etapas.`;
  if (s.hero.number !== String(leader.n)) Object.assign(out, leader.hero);
  return {
    hero: out,
    status: over ? `${leader.short} é campeão de ${s.season}` : `${leader.short} lidera com ${gap} pts de vantagem`,
  };
}

function updatedText(s, round, suffix = "") {
  const r = s.calendar.find(x => x.r === round);
  return r ? `Atualizado após a etapa ${round}: ${r.gp}, ${r.date}.${suffix}` : "";
}

/* ======================================================================
   FÓRMULA 1 (Jolpica)
   ====================================================================== */
async function f1() {
  const s = SERIES.f1;
  const API = `https://api.jolpi.ca/ergast/f1/${SEASON}`;
  const TEAM = { red_bull: "redbullracing", rb: "racingbulls", haas: "haasf1team", aston_martin: "astonmartin", sauber: "audi", kick_sauber: "audi" };
  const teamId = id => TEAM[id] || id;
  const byLast = new Map(s.drivers.map(d => [norm(d.last), d]));
  const mine = drv => byLast.get(norm(drv.familyName));

  const [ds, cs, res, sched] = await Promise.all([
    get(`${API}/driverstandings/`), get(`${API}/constructorstandings/`), get(`${API}/results/1/?limit=100`), get(`${API}/`),
  ]);
  const DS = ds.MRData.StandingsTable.StandingsLists[0], CS = cs.MRData.StandingsTable.StandingsLists[0];
  const round = +DS.round;

  const drivers = DS.DriverStandings.map(x => {
    const d = mine(x.Driver);
    return { key: d ? d.n : null, pos: +x.position, pts: +x.points, wins: +x.wins,
      name: d ? `${d.first} ${d.last}` : `${x.Driver.givenName} ${x.Driver.familyName}`, team: d ? d.team : teamId(x.Constructors.at(-1)?.constructorId) };
  });
  const teams = CS.ConstructorStandings.map(x => ({ id: teamId(x.Constructor.constructorId), pos: +x.position, pts: +x.points }));

  // vencedores e horários de largada, casando a etapa pela data
  const calendar = {};
  for (const race of res.MRData.RaceTable.Races) {
    const r = s.calendar.find(c => near(dateOf(c), Date.parse(race.date)));
    const w = race.Results?.[0];
    if (!r || !w) continue;
    const d = mine(w.Driver);
    calendar[r.r] = { winner: d ? shortName(s, d) : w.Driver.familyName, team: teamId(w.Constructor.constructorId) };
  }
  for (const race of sched.MRData.RaceTable.Races) {
    const r = s.calendar.find(c => near(dateOf(c), Date.parse(race.date)));
    if (r && race.time && !calendar[r.r]) calendar[r.r] = { start: `${race.date}T${race.time}` };
  }

  const live = { round, drivers, teams, calendar };
  const teamOf = id => s.teams.find(t => t.id === id);
  const nar = narrative(s, live, {
    heroFrom: row => {
      const d = s.drivers.find(x => x.n === row.key) || {};
      return { n: d.n, short: d.last, first: d.first, last: d.last, row,
        hero: { number: String(d.n), first: d.first, last: d.last, color: teamOf(d.team)?.color, img: d.imgFull || d.img, alt: `${d.first} ${d.last}` } };
    },
    leaderName: l => `${l.first} ${l.last}`,
    secondName: l => `${l.first} ${l.last}`,
    statsFor: (p, gap) => [["Pontos", String(p.pts)], ["Vitórias", String(p.wins)], ["Vantagem", `+${gap}`]],
  });
  return {
    ...live, ...nar, updated: updatedText(s, round),
    standings: [
      drivers.map(d => ({ pos: d.pos, name: d.name, team: d.team, pts: d.pts })),
      teams.map(t => ({ pos: t.pos, name: teamOf(t.id)?.name || t.id, team: t.id, pts: t.pts })),
    ],
  };
}

/* ======================================================================
   MOTOGP (API do site oficial)
   ====================================================================== */
async function motogp() {
  const s = SERIES.motogp;
  const API = "https://api.motogp.pulselive.com/motogp/v1/results";
  const season = (await get(`${API}/seasons`)).find(x => x.year === SEASON);
  const cat = (await get(`${API}/categories?seasonUuid=${season.id}`)).find(c => /motogp/i.test(c.name));
  const st = await get(`${API}/standings?seasonUuid=${season.id}&categoryUuid=${cat.id}`);
  const events = (await get(`${API}/events?seasonUuid=${season.id}&isFinished=true`)).filter(e => !e.test);

  const TEAM = [[/tech3/i, "tech3"], [/pramac/i, "pramac"], [/gresini/i, "gresini"], [/vr46/i, "vr46"], [/trackhouse/i, "trackhouse"],
    [/lcr/i, "lcr"], [/ktm/i, "ktm"], [/aprilia/i, "aprilia"], [/ducati/i, "ducati"], [/honda/i, "hrc"], [/yamaha/i, "yamaha"]];
  const teamId = name => (TEAM.find(([re]) => re.test(name)) || [])[1];
  const byNum = new Map(s.drivers.map(d => [d.n, d]));

  const drivers = st.classification.map(x => {
    const d = byNum.get(x.rider.number);
    return { key: d ? d.n : null, pos: x.position, pts: x.points, wins: x.race_wins, podiums: x.podiums,
      name: d ? `${d.first} ${d.last}` : x.rider.full_name, team: d ? d.team : teamId(x.team?.name) };
  });
  // equipes: soma dos pontos dos pilotos de cada equipe (como no site)
  const sum = {};
  for (const d of drivers) if (d.team) sum[d.team] = (sum[d.team] || 0) + d.pts;
  const teams = Object.entries(sum).sort((a, b) => b[1] - a[1]).map(([id, p], i) => ({ id, pos: i + 1, pts: p }));

  const calendar = {};
  let round = 0;
  for (const e of events) {
    const r = s.calendar.find(c => near(dateOf(c), Date.parse(e.date_end)));
    if (!r) continue;
    const known = previous.motogp?.calendar?.[r.r];
    if (known?.winner) { calendar[r.r] = known; round = Math.max(round, r.r); continue; } // etapa já registrada: não pede de novo
    const sessions = await get(`${API}/sessions?eventUuid=${e.id}&categoryUuid=${cat.id}`);
    const rac = sessions.find(x => x.type === "RAC" && x.status === "FINISHED");
    if (!rac) continue;
    const cl = await get(`${API}/session/${rac.id}/classification?test=false`);
    const w = cl.classification?.find(x => x.position === 1);
    if (!w) continue;
    const d = byNum.get(w.rider.number);
    calendar[r.r] = { winner: d ? shortName(s, d) : w.rider.full_name.split(" ").at(-1), team: d ? d.team : teamId(w.team?.name) };
    round = Math.max(round, r.r);
  }

  const live = { round, drivers, teams, calendar };
  const teamOf = id => s.teams.find(t => t.id === id);
  const nar = narrative(s, live, {
    heroFrom: row => {
      const d = byNum.get(row.key) || {};
      return { n: d.n, short: d.last, first: d.first, last: d.last,
        hero: { number: String(d.n), first: d.first, last: d.last, color: teamOf(d.team)?.color, img: d.imgFull || d.img, alt: `${d.first} ${d.last}` } };
    },
    leaderName: l => `${l.first} ${l.last}`,
    secondName: l => `${l.first} ${l.last}`,
    statsFor: (p, gap) => [["Pontos", String(p.pts)], ["Pódios", String(p.podiums)], ["Vantagem", `+${gap}`]],
  });
  return {
    ...live, ...nar, updated: updatedText(s, round),
    standings: [
      drivers.map(d => ({ pos: d.pos, name: d.name, team: d.team, pts: d.pts })),
      teams.map(t => ({ pos: t.pos, name: teamOf(t.id)?.name || t.id, team: t.id, pts: t.pts, sub: teamOf(t.id) ? `${teamOf(t.id).ghost} ${teamOf(t.id).car}` : "" })),
    ],
  };
}

/* ======================================================================
   WEC (Wikipedia: tabelas de resultados e classificação da Hypercar)
   ====================================================================== */
async function wec() {
  const s = SERIES.wec;
  const PAGE = `${SEASON}_FIA_World_Endurance_Championship`;
  const W = "https://en.wikipedia.org/w/api.php?format=json&formatversion=2&";
  const secs = (await get(`${W}action=parse&page=${PAGE}&prop=sections`)).parse.sections;
  const section = async re => {
    const sec = secs.find(x => re.test(x.line));
    if (!sec) throw new Error(`seção não encontrada: ${re}`);
    return (await get(`${W}action=parse&page=${PAGE}&prop=wikitext&section=${sec.index}`)).parse.wikitext;
  };
  // tabela da wiki → linhas; cada linha é a lista de células (cabeçalho "!" ou dado "|")
  const rows = wt => wt.split(/\n\|-[^\n]*/).map(block => block.split("\n").filter(l => /^[!|]/.test(l) && !/^\|[}+]/.test(l) && !/^\{\|/.test(l))
    .flatMap(l => l.slice(1).split(/\|\||!!/)).map(c => c.replace(/^[^|[{]*?\|(?!\|)/, "").trim()));
  const linkText = c => (c.match(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/) || [])[1];
  const num = c => { const m = String(c).replace(/'''|''/g, "").match(/^\s*(\d+)\s*$/); return m ? +m[1] : null; };

  const crews = s.drivers.map(d => { const raw = String(d.first).split(/,\s*|\s+e\s+/); return { d, raw, names: raw.map(norm) }; });
  // devolve a tripulação e o sobrenome como o site escreve (ex.: "de Vries")
  const crewOf = full => {
    const n = norm(full);
    for (const c of crews) { const k = c.names.findIndex(x => n === x || n.endsWith(` ${x}`)); if (k >= 0) return { c, k }; }
    return null;
  };
  const carOf = n => s.drivers.find(d => String(+d.n) === String(+n));

  // vencedores da Hypercar por etapa
  const calendar = {};
  let round = 0;
  for (const cells of rows(await section(/^Race results$/i))) {
    const rnd = num(cells[0]);
    const car = cells.join(" ").match(/No\.\s*0*(\d+)/);
    if (!rnd || !car) continue;
    const d = carOf(car[1]);
    if (!d) continue;
    calendar[rnd] = { winner: d.last, team: d.team };
    round = Math.max(round, rnd);
  }

  // pilotos: a wiki lista um por um; o site junta os da mesma tripulação com os mesmos pontos
  const people = [];
  for (const cells of rows(await section(/Hypercar World Endurance Drivers/i))) {
    const pos = num(cells[0]), name = linkText(cells[1] || ""), p = num(cells.at(-1));
    const m = name && crewOf(name);
    if (pos && name && p != null) people.push({ pos, name, pts: p, crew: m?.c, k: m?.k ?? 0 });
  }
  const groups = [];
  for (const x of people) {
    if (!x.crew) continue;
    const g = groups.find(g => g.crew === x.crew && g.pts === x.pts);
    if (g) g.members.push(x); else groups.push({ crew: x.crew, pts: x.pts, pos: x.pos, members: [x] });
  }
  for (const g of groups) g.members.sort((a, b) => a.k - b.k);
  groups.sort((a, b) => a.pos - b.pos);
  const drivers = s.drivers.map(d => {
    const g = groups.filter(x => x.crew.d === d);
    const best = g.sort((a, b) => a.pos - b.pos)[0];
    return { key: String(d.n), pos: best ? best.pos : null, pts: best ? best.pts : null, wins: Object.values(calendar).filter(c => c.winner === d.last).length };
  });

  // fabricantes
  const teams = [];
  for (const cells of rows(await section(/Hypercar World Endurance Manufacturers/i))) {
    const pos = num(cells[0]), name = linkText(cells.find(c => /\[\[/.test(c)) || ""), p = num(cells.at(-1));
    const t = name && s.teams.find(t => norm(t.name) === norm(name) || norm(name).startsWith(norm(t.name)));
    if (pos && t && p != null) teams.push({ id: t.id, pos, pts: p });
  }

  const live = { round, drivers: drivers.filter(d => d.pos), teams, calendar };
  const nar = narrative(s, live, {
    isCrew: true,
    heroFrom: row => {
      const d = carOf(row.key) || {};
      const t = s.teams.find(t => t.id === d.team) || {};
      const names = String(d.first).split(/,\s*/);
      return { n: d.n, short: d.last,
        names: names.length > 1 ? `${names.slice(0, -1).join(", ")} e ${names.at(-1)}` : names[0], car: d.last,
        hero: { number: String(d.n), first: names.length > 1 ? `${names.slice(0, -1).join(", ")} e ${names.at(-1)}` : names[0], last: d.last,
          color: t.color, img: t.views?.[0]?.img || t.img, alt: `${t.name} ${t.car}, visto de lado` } };
    },
    leaderName: l => `${l.names}, do ${l.car},`,
    secondName: l => `o ${l.car}`,
    statsFor: (p, gap) => [["Pontos", String(p.pts)], ["Vitórias", String(drivers.find(d => d.key === p.key)?.wins ?? 0)], ["Vantagem", `+${gap}`]],
  });
  const teamOf = id => s.teams.find(t => t.id === id);
  return {
    ...live, ...nar, updated: updatedText(s, round, " Classe Hypercar."),
    standings: [
      groups.slice(0, 10).map(g => ({ pos: g.pos, team: g.crew.d.team, pts: g.pts, sub: g.crew.d.last,
        name: g.members.length > 1 ? g.members.map(m => g.crew.raw[m.k]).join(" / ") : g.members[0].name })),
      teams.map(t => ({ pos: t.pos, name: teamOf(t.id)?.name || t.id, team: t.id, pts: t.pts, sub: teamOf(t.id) ? `${teamOf(t.id).car} · ${teamOf(t.id).ghost}` : "" })),
    ],
  };
}

/* ======================================================================
   Gravação
   ====================================================================== */
const out = { generated: previous.generated || null };
const report = [];
for (const [id, fn] of [["f1", f1], ["motogp", motogp], ["wec", wec]]) {
  try {
    const data = await fn();
    // conferência mínima antes de publicar: classificação com gente e etapa coerente
    if (!data.drivers?.length || !data.standings?.[0]?.length || !(data.round >= 0)) throw new Error("dados incompletos");
    out[id] = data;
    report.push(`${id}: etapa ${data.round}, líder ${data.standings[0][0]?.name} (${data.standings[0][0]?.pts})`);
  } catch (e) {
    out[id] = previous[id];
    report.push(`${id}: FALHOU (${e.message}); mantidos os dados anteriores`);
  }
}
const strip = o => JSON.stringify({ ...o, generated: null });
if (strip(out) !== strip(previous)) {
  out.generated = new Date().toISOString();
  writeFileSync(LIVE_FILE,
    "// Gerado automaticamente por scripts/update-data.mjs. Não edite à mão.\n" +
    `window.LIVE = ${JSON.stringify(out, null, 1)};\n`);
  report.push("data/live.js atualizado");
} else report.push("sem mudanças");
console.log(report.join("\n"));
