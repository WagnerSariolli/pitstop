// Pitstop · boletim por e-mail.
// Roda no GitHub Actions logo depois de scripts/update-data.mjs. Envia pelo Buttondown (buttondown.com):
//   • um e-mail de resultados sempre que aparece um vencedor novo em qualquer campeonato;
//   • a agenda do fim de semana, às quintas-feiras, quando há corrida nos próximos dias.
// O que já foi avisado fica em data/newsletter-state.json, para nunca mandar a mesma notícia duas vezes.
// Sem a chave BUTTONDOWN_API_KEY (segredo do repositório) nada é enviado: o e-mail só aparece no log.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://wagnersariolli.github.io/pitstop/";
const KEY = process.env.BUTTONDOWN_API_KEY || "";
const STATE_FILE = path.join(ROOT, "data", "newsletter-state.json");
const SEASON = 2026;

/* ---------- dados do site, com a camada ao vivo aplicada ---------- */
const ctx = { window: {}, SERIES: {} };
ctx.window.SERIES = ctx.SERIES;
vm.createContext(ctx);
for (const f of ["f1", "formulae", "motogp", "wec", "live", "circuits"]) {
  const file = path.join(ROOT, "data", `${f}.js`);
  if (existsSync(file)) vm.runInContext(readFileSync(file, "utf8"), ctx);
}
const SERIES = ctx.SERIES, LIVE = ctx.window.LIVE || {}, VENUES = ctx.window.VENUES || {};
const ORDER = ["f1", "formulae", "motogp", "wec"].filter(id => SERIES[id]);
for (const [id, live] of Object.entries(LIVE)) {
  const s = SERIES[id];
  if (!s || !live || typeof live !== "object") continue;
  for (const [r, x] of Object.entries(live.calendar || {})) Object.assign(s.calendar.find(c => String(c.r) === r) || {}, x);
  (live.standings || []).forEach((rows, i) => { if (s.standings[i] && rows?.length) s.standings[i].rows = rows; });
  if (live.hero) Object.assign(s.hero, live.hero);
}

/* ---------- utilidades ---------- */
const MONTHS = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
const raceDate = r => {
  if (r.start) return new Date(r.start);
  const m = String(r.date).match(/(\d{1,2})\s+([a-z]{3})/i);
  return m ? new Date(Date.UTC(SEASON, MONTHS[m[2].toLowerCase()], +m[1], 12)) : null;
};
const teamName = (s, id) => s.teams.find(t => t.id === id)?.name || "";
const brt = d => d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });
const day = d => d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long" });
const venueLink = (s, r) => { const v = VENUES[s.id]?.[s.calendar.indexOf(r)]; return v ? `${SITE}?pista=${v}` : null; };
const isoWeek = d => {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const n = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - n);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - y0) / 864e5 + 1) / 7)).padStart(2, "0")}`;
};

/* ---------- estado: o que já foi avisado ---------- */
const winnersNow = () => Object.fromEntries(ORDER.map(id => [id, SERIES[id].calendar.filter(r => r.winner).map(r => r.r)]));
const firstRun = !existsSync(STATE_FILE);
const state = firstRun ? { notified: winnersNow(), agenda: [] } : JSON.parse(readFileSync(STATE_FILE, "utf8"));
state.notified ||= {}; state.agenda ||= [];

/* ---------- e-mail de resultados ---------- */
function resultsEmail(items) {
  const parts = items.map(({ s, r }) => {
    const done = s.calendar.filter(x => x.winner).length, total = s.calendar.length;
    const next = s.calendar.find(x => !x.winner);
    const table = (s.standings[0]?.rows || []).slice(0, 5)
      .map(x => `${x.pos}. ${x.name}${x.sub ? ` (${x.sub})` : ""} — ${x.pts} pts`).join("\n");
    const link = venueLink(s, r);
    return [
      `## ${s.name} · Etapa ${r.r} · ${r.gp}`,
      `**Vitória de ${r.winner}**${teamName(s, r.team) ? ` (${teamName(s, r.team)})` : ""} em ${r.circuit}, ${r.date}.`,
      s.hero?.lede ? s.hero.lede : "",
      `**Classificação depois de ${done} de ${total} etapas**\n\n${table}`,
      next ? `**Próxima etapa:** ${next.gp}, ${next.date} (${next.circuit}).` : `**Fim de temporada.**`,
      `[Ver a temporada no Pitstop](${SITE}?c=${s.id}#temporada)${link ? ` · [Guia da pista](${link})` : ""}`,
    ].filter(Boolean).join("\n\n");
  });
  const subject = items.length === 1
    ? `${items[0].s.short} · ${items[0].r.gp}: vitória de ${items[0].r.winner}`
    : `Resultados: ${items.map(({ s, r }) => `${s.short} ${r.gp}`).join(", ")}`;
  return { subject, body: parts.join("\n\n---\n\n") + footer() };
}

/* ---------- agenda do fim de semana (quintas-feiras) ---------- */
function agendaEmail(now) {
  const until = new Date(now.getTime() + 5 * 864e5);
  const races = ORDER.flatMap(id => SERIES[id].calendar.filter(r => !r.winner).map(r => ({ s: SERIES[id], r, d: raceDate(r) })))
    .filter(x => x.d && x.d >= now && x.d <= until).sort((a, b) => a.d - b.d);
  if (!races.length) return null;
  const lines = races.map(({ s, r, d }) => {
    const link = venueLink(s, r);
    const lead = s.standings[0]?.rows?.[0];
    return [
      `## ${s.name} · ${r.gp}`,
      `${r.circuit} · ${r.start ? `largada ${brt(d)} (horário de Brasília)` : day(d)}`,
      lead ? `Líder do campeonato: ${lead.name}, ${lead.pts} pts.` : "",
      link ? `[Guia da pista: traçado, recorde e mapa](${link})` : "",
    ].filter(Boolean).join("\n\n");
  });
  return {
    subject: `Agenda do fim de semana: ${races.map(({ s, r }) => `${s.short} ${r.gp}`).join(", ")}`,
    body: lines.join("\n\n---\n\n") + footer(),
  };
}

const footer = () => `\n\n---\n\nVocê recebe este boletim porque se inscreveu no [Pitstop](${SITE}), um projeto de fã sem vínculo com os campeonatos.`;

/* ---------- envio ---------- */
async function send({ subject, body }) {
  if (!KEY) {
    console.log(`[sem BUTTONDOWN_API_KEY: nada enviado]\nAssunto: ${subject}\n\n${body}\n`);
    return true;
  }
  const r = await fetch("https://api.buttondown.com/v1/emails", {
    method: "POST",
    headers: {
      Authorization: `Token ${KEY}`, "Content-Type": "application/json",
      "X-API-Version": "2026-04-01", "X-Buttondown-Live-Dangerously": "true",
    },
    body: JSON.stringify({ subject, body, status: "about_to_send" }),
  });
  if (!r.ok) { console.error(`Buttondown recusou (${r.status}): ${await r.text()}`); return false; }
  console.log(`Enviado: ${subject}`);
  return true;
}

/* ---------- conferência da conta (só leitura, não envia nada) ---------- */
if (KEY) {
  try {
    const r = await fetch("https://api.buttondown.com/v1/subscribers?type=regular", {
      headers: { Authorization: `Token ${KEY}`, "X-API-Version": "2026-04-01" },
    });
    if (r.ok) { const j = await r.json(); console.log(`Buttondown conectado: ${j.count ?? "?"} assinante(s) confirmado(s).`); }
    else console.error(`Buttondown: a chave foi recusada (${r.status}). Confira o segredo BUTTONDOWN_API_KEY.`);
  } catch (e) { console.error(`Buttondown fora do ar: ${e.message}`); }
}

/* ---------- modo de teste: manda os modelos só para NEWSLETTER_TEST_TO, sem tocar na lista nem no estado ---------- */
const TEST_TO = process.env.NEWSLETTER_TEST_TO || "";
if (TEST_TO) {
  const latest = ORDER.filter(id => !SERIES[id].seasonOver).map(id => {
    const done = SERIES[id].calendar.filter(r => r.winner);
    return done.length ? { s: SERIES[id], r: done.at(-1) } : null;
  }).filter(Boolean);
  const newest = Math.max(...latest.map(x => raceDate(x.r)));
  const mails = [resultsEmail(latest.filter(x => raceDate(x.r) >= newest - 2 * 864e5)), agendaEmail(new Date())].filter(Boolean);
  for (const m of mails) {
    const h = { Authorization: `Token ${KEY}`, "Content-Type": "application/json", "X-API-Version": "2026-04-01" };
    const d = await fetch("https://api.buttondown.com/v1/emails", { method: "POST", headers: h, body: JSON.stringify({ subject: `[Teste] ${m.subject}`, body: m.body, status: "draft" }) });
    if (!d.ok) { console.error(`Rascunho recusado (${d.status}): ${await d.text()}`); process.exit(1); }
    const { id } = await d.json();
    const r = await fetch(`https://api.buttondown.com/v1/emails/${id}/send-draft`, { method: "POST", headers: h, body: JSON.stringify({ recipients: [TEST_TO] }) });
    console.log(r.ok ? `Teste enviado: ${m.subject}` : `Envio do teste recusado (${r.status}): ${await r.text()}`);
    if (!r.ok) process.exit(1);
  }
  process.exit(0);
}

/* ---------- execução ---------- */
const now = process.env.PITSTOP_NOW ? new Date(process.env.PITSTOP_NOW) : new Date(); // PITSTOP_NOW: só para testes
let changed = firstRun;
if (firstRun) console.log("Primeira execução: registrando os resultados atuais, sem enviar nada.");

const fresh = ORDER.flatMap(id => SERIES[id].calendar
  .filter(r => r.winner && !(state.notified[id] || []).includes(r.r))
  .map(r => ({ s: SERIES[id], r })));
if (fresh.length && await send(resultsEmail(fresh))) {
  for (const { s, r } of fresh) (state.notified[s.id] ||= []).push(r.r);
  changed = true;
}

// quinta-feira a partir das 12h (UTC), uma vez por semana
const week = isoWeek(now);
if (now.getUTCDay() === 4 && now.getUTCHours() >= 12 && !state.agenda.includes(week)) {
  const mail = agendaEmail(now);
  if (!mail || await send(mail)) { state.agenda = [...state.agenda.slice(-20), week]; changed = true; }
}

if (changed) writeFileSync(STATE_FILE, JSON.stringify(state, null, 1) + "\n");
console.log(changed ? "Estado do boletim atualizado." : "Nada novo para o boletim.");
