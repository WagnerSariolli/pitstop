// WEC em inglês: só os textos, por cima de data/wec.js (veja I18N.localize em i18n.js).
// Ao mudar um texto em data/wec.js, mude aqui também.
EN.wec = {
  status: "Toyota #8 leads; Toyota won Le Mans",
  updated: "Updated after round 6, 6 Hours of Fuji, 27 September 2026. Hypercar class.",
  labels: { garage: "Garage", people: "Crews", rules: "Rules" },
  garageLede: "The 8 manufacturers in the Hypercar class. Pick one to see the prototype, its spec sheet and its performance.",
  peopleLede: "The 17 Hypercars and their drivers. Each car has two or three drivers who take turns at the wheel.",
  terms: {
    "V6 3,5 L biturbo + híbrido dianteiro": "3.5 L twin-turbo V6 + front hybrid",
    "V8 4,0 L biturbo + híbrido padrão": "4.0 L twin-turbo V8 + spec hybrid",
    "V6 3,0 L biturbo + híbrido dianteiro": "3.0 L twin-turbo V6 + front hybrid",
    "V6 3,4 L turbo + híbrido padrão": "3.4 L turbo V6 + spec hybrid",
    "V8 5,5 L aspirado + híbrido padrão": "5.5 L naturally aspirated V8 + spec hybrid",
    "V12 6,5 L aspirado (sem híbrido)": "6.5 L naturally aspirated V12 (no hybrid)",
    "V6 2,6 L biturbo + híbrido dianteiro": "2.6 L twin-turbo V6 + front hybrid",
    "V8 biturbo + híbrido padrão": "Twin-turbo V8 + spec hybrid",
    "Bélgica (WRT)": "Belgium (WRT)", "Coreia do Sul (marca)": "South Korea (brand)",
  },
  hero: {
    kicker: "Championship leaders · after 6 of 8 rounds",
    first: "Buemi, Hartley and Hirakawa",
    lede: "The #8 trio won at Imola and Fuji and lead by 10 points over their #7 teammates, who won the 24 Hours of Le Mans by just 10.9 seconds.",
    stats: [["Points", "89"], ["Wins", "2"], ["Lead", "+10"]],
    alt: "Toyota TR010 Hybrid number 8, side view",
  },
  team: t => {
    const wins = +(String(t.ptsLabel).match(/·\s*(\d+)/)?.[1] || 0);
    return { ptsLabel: `${t.pts} pts among the manufacturers · ${wins} ${wins === 1 ? "win" : "wins"}` };
  },
  teams: {
    toyota: { note: "Won at Imola, Fuji and the 24 Hours of Le Mans, the brand's sixth win in the race. Leads both championships." },
    bmw: { note: "Its first win at the top of endurance racing in 27 years, at Spa, with a one-two. Also won at Interlagos." },
    ferrari: { note: "Three-time Le Mans winner between 2023 and 2025. In 2026 it won in Austin. Runs three cars, including Kubica's yellow #83." },
    alpine: { note: "Renault's sporting arm in endurance racing. Consistent, fighting for third among the manufacturers." },
    cadillac: { note: "The only naturally aspirated V8 in the class, with the deepest roar on the grid. Locked out the front row at Interlagos." },
    astonmartin: { note: "Derived from a road-going hypercar. It's the only one with no hybrid system and a V12 engine." },
    peugeot: { note: "Born without a rear wing, a concept dropped in 2024. Has Vandoorne and Cassidy, two former Formula E champions." },
    genesis: { note: "Hyundai's luxury brand debuted in 2026. Brazil's Pipo Derani drives the #17." },
  },
  driver: d => ({ bio: d.pos ? `${I18N.ordinal(d.pos)} in the Hypercar drivers' championship.` : "Outside the top 10 of the drivers' championship." }),
  calendar: {
    1: { gp: "6 Hours of Imola" },
    2: { gp: "6 Hours of Spa" },
    3: { gp: "24 Hours of Le Mans" },
    4: { gp: "6 Hours of São Paulo" },
    6: { gp: "6 Hours of Fuji" },
    7: { gp: "6 Hours of Barcelona" },
    8: { gp: "6 Hours of Monza" },
  },
  standings: [{ label: "Drivers", note: "Top 10 in the Hypercar class." }, { label: "Manufacturers" }],
  ratingLabels: { vel: "Speed", efic: "Efficiency", confiab: "Reliability", pneus: "Tyre wear", trip: "Crew" },
  commonSpecs: [
    ["Maximum power", "≈ 500 kW (≈ 680 hp), adjusted by BoP"], ["Minimum weight", "≈ 1,030 kg, adjusted by BoP"],
    ["Maximum length", "5,100 mm"], ["Maximum width", "2,000 mm"], ["Tyres", "Michelin"],
    ["Fuel", "100% renewable"], ["Drivers per car", "2 or 3"], ["Top speed", "≈ 340 km/h (Hunaudières straight)"],
  ],
  calendarNote: "8 rounds. Qatar and Bahrain were cancelled and replaced by Barcelona and Monza.",
  rules: {
    title: "Hypercar: two recipes, one class",
    lede: "Two kinds of prototype race in WEC's top class. The FIA balances them so they can fight for the win.",
    compare: {
      head: ["Item", "LMH", "LMDh"],
      rows: [
        ["Chassis", "Free, built by the manufacturer", "One of 4 suppliers (Dallara, Ligier, Multimatic, Oreca)"],
        ["Hybrid system", "Optional, on the front axle", "Mandatory and standardised, on the rear axle"],
        ["Drive", "All-wheel above 190 km/h (with hybrid)", "Rear"],
        ["Cars in 2026", "Toyota, Ferrari, Peugeot, Aston Martin", "BMW, Cadillac, Alpine, Genesis"],
      ],
    },
    cards: [
      ["Balance of performance", "So that such different cars can race together, the FIA adjusts each model's weight and power. In 2026 these tables stopped being published."],
      ["Two classes on track", "The Hypercars fight for the overall win; the GT3s (LMGT3) race at the same time, with at least one amateur driver per car."],
      ["Driver changes", "Each car has two or three drivers. At Le Mans, no one may drive more than 14 hours in total."],
    ],
  },
  facts: [
    { big: "10.9 s", text: "The gap between the #7 Toyota and the #20 BMW at the end of the 2026 24 Hours of Le Mans." },
    { big: "6", text: "Toyota's Le Mans wins. The 2026 win ended three years in a row for Ferrari." },
    { big: "27 years", text: "How long BMW waited for a win in the top class of world endurance racing, until Spa 2026." },
    { big: "8", text: "Manufacturers in the Hypercar class in 2026, with Genesis's debut." },
    { big: "Pipo", text: "Luis Felipe Derani, known as Pipo Derani, is the Brazilian in the Hypercar class, in the #17 Genesis." },
    { big: "#83", text: "The yellow Ferrari of Kubica, Ye and Hanson won Le Mans in 2025 as a privateer entry." },
    { big: "V12", text: "The Aston Martin Valkyrie is the only car on the grid with no hybrid system." },
    { big: "5,000 km", text: "The approximate distance covered by the winner of the 24 Hours of Le Mans." },
  ],
  footer: "Data from fiawec.com, the FIA and specialist press. Images © FIA WEC / ACO.",
};
