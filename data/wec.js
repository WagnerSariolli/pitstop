// WEC 2026 (classe Hypercar) — fontes: fiawec.com, FIA, Pit Debrief; após a etapa 6 (6 Horas de Fuji, 27 set 2026)
(() => {
  const U = f => `https://www.fiawec.com/uploads/${f}.png`;

  // [id, nome, equipe, carro, cor, categoria, motor, chassi, base, pos, pts, vitórias, ratings, imagem, nota]
  const T = [
    ["toyota", "Toyota", "Toyota Racing", "TR010 Hybrid", "#EB0A1E", "LMH", "V6 3,5 L biturbo + híbrido dianteiro", "Toyota", "Colônia, Alemanha", 1, 169, 3, [93, 94, 90, 92, 95],
      U("2026-wec-8-toyota-gr010-droite-69ef599a5dfc2383937758"), "Venceu Ímola, Fuji e as 24 Horas de Le Mans, a sexta vitória da marca na prova. Lidera os dois campeonatos."],
    ["bmw", "BMW", "BMW M Team WRT", "M Hybrid V8", "#1F5FD6", "LMDh", "V8 4,0 L biturbo + híbrido padrão", "Dallara", "Baudour, Bélgica (WRT)", 2, 146, 2, [94, 90, 91, 90, 91],
      U("2026-wec-20-bmwm-hybrid-v8-droite-69ef599f58985019540552"), "Primeira vitória no topo do endurance em 27 anos, em Spa, com dobradinha. Venceu também em Interlagos."],
    ["ferrari", "Ferrari", "Ferrari AF Corse", "499P", "#FFC72C", "LMH", "V6 3,0 L biturbo + híbrido dianteiro", "Ferrari", "Maranello, Itália", 3, 115, 1, [92, 90, 92, 90, 93],
      U("2026-wec-50-ferrari-499-droit-69ef59a283984016887771"), "Tricampeã de Le Mans entre 2023 e 2025. Em 2026 venceu em Austin. Tem três carros, incluindo o #83 amarelo de Kubica."],
    ["alpine", "Alpine", "Alpine Endurance Team", "A424", "#3D8BFF", "LMDh", "V6 3,4 L turbo + híbrido padrão", "Oreca", "Viry-Châtillon, França", 4, 96, 0, [88, 88, 89, 88, 88],
      U("2026-wec-35-alpine-a424-droit-69ef59a0cbea1140658677"), "O braço esportivo da Renault no endurance. Regular, briga pelo terceiro lugar entre os fabricantes."],
    ["cadillac", "Cadillac", "Cadillac Hertz Team Jota", "V-Series.R", "#F2C200", "LMDh", "V8 5,5 L aspirado + híbrido padrão", "Dallara", "Kettering, Reino Unido", 5, 96, 0, [90, 87, 88, 87, 89],
      U("2026-wec-12-cadillac-droit-69ef599bb359a378434336"), "O único V8 aspirado da classe, com o ronco mais grave do grid. Fez a primeira fila inteira em Interlagos."],
    ["astonmartin", "Aston Martin", "Aston Martin THOR Team", "Valkyrie", "#1F8A70", "LMH", "V12 6,5 L aspirado (sem híbrido)", "Aston Martin", "Gaydon, Reino Unido", 6, 54, 0, [84, 80, 82, 84, 85],
      U("2026-wec-007-aston-martin-valkyrie-droit-69ef5999441ee923225009"), "Derivado de um hipercarro de rua. É o único sem sistema híbrido e com motor V12."],
    ["peugeot", "Peugeot", "Peugeot TotalEnergies", "9X8", "#C8F000", "LMH", "V6 2,6 L biturbo + híbrido dianteiro", "Peugeot", "Satory, França", 7, 24, 0, [82, 84, 83, 82, 86],
      U("2026-wec-93-peugeot-9x8-droite-69de032b1a0d8786392454"), "Nasceu sem asa traseira, conceito abandonado em 2024. Tem Vandoorne e Cassidy, dois ex-campeões da Fórmula E."],
    ["genesis", "Genesis", "Genesis Magma Racing", "GMR-001", "#C08552", "LMDh", "V8 biturbo + híbrido padrão", "Oreca", "Coreia do Sul (marca)", 8, 12, 0, [78, 80, 79, 80, 84],
      U("2026-wec-17-genesis-droite-v2-6aaa4019663e9618460298"), "A marca de luxo da Hyundai estreou em 2026. Tem o brasileiro Pipo Derani no carro #17."],
  ];
  const teams = T.map(([id, name, full, car, color, cat, engine, chassis, base, pos, pts, wins, r, img, note]) => ({
    id, name, full, car, color, pos, pts, img, note, ghost: cat,
    ptsLabel: `${pts} pts entre os fabricantes · ${wins} ${wins === 1 ? "vitória" : "vitórias"}`,
    ratings: { vel: r[0], efic: r[1], confiab: r[2], pneus: r[3], trip: r[4] },
    specs: [["Carro", car], ["Categoria", cat], ["Motor", engine], ["Chassi", chassis], ["Base", base]],
  }));

  // tripulações: [nº, fabricante, equipe curta, pilotos, países, fotos, pos, pts]
  const C = [
    ["8", "toyota", "Toyota", ["Sébastien Buemi", "Brendon Hartley", "Ryō Hirakawa"], "Suíça, Nova Zelândia, Japão",
      ["8-sebastien-buemi-right-69e1f22fd6db6530188059", "8-brendon-hartley-right-69e1f22f7fbac838023269", "8-ryo-hirakawa-right-69e1f22fabb70936336865"], 1, 89, 2],
    ["7", "toyota", "Toyota", ["Mike Conway", "Kamui Kobayashi", "Nyck de Vries"], "Reino Unido, Japão, Holanda",
      ["7-mike-conway-right-69e1f22de058c661102174", "7-kamui-kobayashi-right-69e1f22db6d08760572733", "7-nyck-de-vries-right-69e1f233088df563086067"], 2, 79, 1],
    ["20", "bmw", "BMW", ["René Rast", "Robin Frijns", "Sheldon van der Linde"], "Alemanha, Holanda, África do Sul",
      ["20-rene-rast-right-69e1f225f3261309694954", "20-robin-frijns-right-69e1f22629959297130826", "20-sheldon-van-der-linde-right-69fe1f9f40fa2516445749"], 3, 75, 1],
    ["15", "bmw", "BMW", ["Kevin Magnussen", "Raffaele Marciello", "Dries Vanthoor"], "Dinamarca, Suíça, Bélgica",
      ["15-kevin-magnussen-right-69e1f224dd077900745434", "15-raffaele-marciello-right-69e1f225192bf853265424", "15-dries-vanthoor-right-69fe1f9e1cac4455023330"], 4, 69, 1],
    ["51", "ferrari", "Ferrari", ["Alessandro Pier Guidi", "James Calado", "Antonio Giovinazzi"], "Itália, Reino Unido, Itália",
      ["51-alessandro-pier-guidi-right-69e1f232d26a3201493181", "51-james-calado-right-69e1f22b5dbd8695586862", "51-antonio-giovinazzi-right-69e1f22b2d631280497480"], 7, 59, 0],
    ["35", "alpine", "Alpine", ["Charles Milesi", "Ferdinand Habsburg", "António Félix da Costa"], "França, Áustria, Portugal",
      ["35-charles-milesi-right-69e1f22962410952787119", "35-ferdinand-habsburg-right-69e1f2298ff92620981827", "35-antonio-felix-da-costa-right-69e1f232a7ad5929080471"], 8, 56, 0],
    ["50", "ferrari", "Ferrari", ["Antonio Fuoco", "Miguel Molina", "Nicklas Nielsen"], "Itália, Espanha, Dinamarca",
      ["50-antonio-fuoco-right-69e1f22aa6faf347560807", "50-miguel-molina-right-69e1f22ad051f610966537", "50-nicklas-nielsen-right-69e1f22b031c6398499742"], 9, 54, 1],
    ["12", "cadillac", "Cadillac", ["Will Stevens", "Norman Nato"], "Reino Unido, França",
      ["12-will-stevens-right-69e1f224b122c323021459", "12-norman-nato-right-69e1f22485ff0802804412"], 10, 50, 0],
    ["38", "cadillac", "Cadillac", ["Earl Bamber", "Sébastien Bourdais", "Jack Aitken"], "Nova Zelândia, França, Reino Unido",
      ["38-earl-bamber-right-69e1f22a48a34219261096", "38-sebastien-bourdais-right-69e1f22a7332c351753583", "38-jack-aitken-right-69fe1f9d69fd5067851003"]],
    ["83", "ferrari", "AF Corse", ["Robert Kubica", "Yifei Ye", "Phil Hanson"], "Polônia, China, Reino Unido",
      ["83-robert-kubica-right-69e1f2303d3db380837716", "83-yifei-ye-right-69e1f2306934d244395376", "83-philip-hanson-right-69e1f2300b3a4808537591"]],
    ["36", "alpine", "Alpine", ["Frédéric Makowiecki", "Jules Gounon", "Victor Martins"], "França, Andorra, França",
      ["36-frederic-makowiecki-right-69e1f229bb322141603865", "36-jules-gounon-right-69e1f229e58f6278150122", "36-victor-martins-right-69e1f22a1b782168546228"]],
    ["007", "astonmartin", "Aston Martin", ["Harry Tincknell", "Tom Gamble"], "Reino Unido, Reino Unido",
      ["007-harry-tincknell-right-69e1f22359c4f325145752", "007-tom-gamble-right-69e1f22394b1c876766494"]],
    ["009", "astonmartin", "Aston Martin", ["Alex Riberas", "Marco Sørensen"], "Espanha, Dinamarca",
      ["009-alex-riberas-right-69e1f223c60c6281831072", "009-marco-sorensen-right-69e1f23201e3a153352452"]],
    ["93", "peugeot", "Peugeot", ["Paul di Resta", "Stoffel Vandoorne", "Nick Cassidy"], "Reino Unido, Bélgica, Nova Zelândia",
      ["93-paul-di-resta-right-69fe218e5f729841909857", "93-stoffel-vandoorne-right-69fe218d9f421153087790", "93-nick-cassidy-right-69fe218d6fce3297344757"]],
    ["94", "peugeot", "Peugeot", ["Loïc Duval", "Malthe Jakobsen", "Théo Pourchaire"], "França, Dinamarca, França",
      ["94-loic-duval-right-69fe218dd282c067885858", "94-malthe-jakobsen-right-69fe218e0a5a5233661293", "94-theo-pourchaire-right-69fe218e34515461428335"]],
    ["17", "genesis", "Genesis", ["André Lotterer", "Pipo Derani", "Mathys Jaubert"], "Alemanha, Brasil, França",
      ["17-andre-lotterer-right-69e1f225439c8246545587", "17-luis-felipe-derani-right-69e1f23228597021506228", "17-mathys-jaubert-right-69e1f22571d41588338418"]],
    ["19", "genesis", "Genesis", ["Mathieu Jaminet", "Paul-Loup Chatin", "Daniel Juncadella"], "França, França, Espanha",
      ["19-mathieu-jaminet-right-69e1f225c81eb978886287", "19-paul-loup-chatin-right-69e1f23250a1b641201593", "19-daniel-juncadella-right-69e1f2259f025435219463"]],
  ];
  // fotos dos pilotos (fiawec.com) convertidas para WebP em img/wec: os originais têm de 1 a 8 MB cada
  const lastName = full => full.split(" ").slice(1).join(" ");
  const drivers = C.map(([n, team, short, names, countries, photos, pos, pts, wins]) => ({
    n, team, pos, pts, wins,
    first: names.map(lastName).join(", "), last: `${short} #${n}`,
    imgs: photos.map(p => `img/wec/${p.split("-right-")[0]}.webp`),
    extra: [["Pilotos", names.join(", ")], ["Países", countries]],
    bio: pos ? `${pos}º colocados no campeonato de pilotos da classe Hypercar.` : "Fora do top 10 do campeonato de pilotos.",
  }));

  const R = [
    [1, "6 Horas de Ímola", "Ímola, Itália", "19 abr", "Toyota #8", "toyota"],
    [2, "6 Horas de Spa", "Spa-Francorchamps, Bélgica", "09 mai", "BMW #20", "bmw"],
    [3, "24 Horas de Le Mans", "Circuit de la Sarthe, França", "14 jun", "Toyota #7", "toyota"],
    [4, "6 Horas de São Paulo", "Interlagos, Brasil", "12 jul", "BMW #15", "bmw"],
    [5, "Lone Star Le Mans", "Circuito das Américas, EUA", "06 set", "Ferrari #50", "ferrari"],
    [6, "6 Horas de Fuji", "Fuji, Japão", "27 set", "Toyota #8", "toyota"],
    [7, "6 Horas de Barcelona", "Barcelona-Catalunya, Espanha", "18 out"],
    [8, "6 Horas de Monza", "Monza, Itália", "08 nov"],
  ];
  const calendar = R.map(([r, gp, circuit, date, winner, team]) => ({ r, gp, circuit, date, winner, team }));

  SERIES.wec = {
    id: "wec", name: "WEC / Le Mans", short: "WEC", season: "2026", accent: "#00B2E3",
    status: "Toyota #8 lidera; Toyota venceu Le Mans",
    updated: "Atualizado após a etapa 6, 6 Horas de Fuji, 27 de setembro de 2026. Classe Hypercar.",
    labels: { garage: "Garagem", people: "Tripulações", rules: "Regras" },
    garageLede: "Os 8 fabricantes da classe Hypercar. Escolha um para ver o protótipo, a ficha técnica e o desempenho.",
    peopleLede: "Os 17 Hypercars e seus pilotos. Cada carro tem dois ou três pilotos que se revezam ao volante.",
    noCrewNote: "",
    stageMaxW: 1100, card: { w: "52%", top: "10%" },
    hero: {
      kind: "wide", color: "#EB0A1E", number: "8",
      kicker: "Líderes do campeonato · após 6 de 8 etapas", first: "Buemi, Hartley e Hirakawa", last: "Toyota #8",
      lede: "O trio do carro #8 venceu em Ímola e Fuji e lidera com 10 pontos sobre os companheiros do #7, que ganharam as 24 Horas de Le Mans por apenas 10,9 segundos.",
      stats: [["Pontos", "89"], ["Vitórias", "2"], ["Vantagem", "+10"]],
      img: U("2026-wec-8-toyota-gr010-droite-69ef599a5dfc2383937758"), alt: "Toyota TR010 Hybrid número 8, visto de lado",
    },
    teams, drivers, calendar,
    ratingLabels: { vel: "Velocidade", efic: "Eficiência", confiab: "Confiabilidade", pneus: "Desgaste de pneus", trip: "Tripulação" },
    commonSpecs: [
      ["Potência máxima", "≈ 500 kW (≈ 680 cv), ajustada pelo BoP"], ["Peso mínimo", "≈ 1.030 kg, ajustado pelo BoP"],
      ["Comprimento máximo", "5.100 mm"], ["Largura máxima", "2.000 mm"], ["Pneus", "Michelin"],
      ["Combustível", "100% renovável"], ["Pilotos por carro", "2 ou 3"], ["Velocidade máxima", "≈ 340 km/h (reta Hunaudières)"],
    ],
    standings: [
      { label: "Pilotos", note: "Top 10 da classe Hypercar.", rows: [
        { pos: 1, name: "Buemi / Hartley / Hirakawa", team: "toyota", pts: 89, sub: "Toyota #8" },
        { pos: 2, name: "Conway / Kobayashi / de Vries", team: "toyota", pts: 79, sub: "Toyota #7" },
        { pos: 3, name: "Rast / Frijns", team: "bmw", pts: 75, sub: "BMW #20" },
        { pos: 4, name: "Magnussen / Marciello", team: "bmw", pts: 69, sub: "BMW #15" },
        { pos: 5, name: "Sheldon van der Linde", team: "bmw", pts: 65, sub: "BMW #20" },
        { pos: 6, name: "Dries Vanthoor", team: "bmw", pts: 63, sub: "BMW #15" },
        { pos: 7, name: "Pier Guidi / Calado / Giovinazzi", team: "ferrari", pts: 59, sub: "Ferrari #51" },
        { pos: 8, name: "Milesi / Habsburg", team: "alpine", pts: 56, sub: "Alpine #35" },
        { pos: 9, name: "Fuoco / Molina / Nielsen", team: "ferrari", pts: 54, sub: "Ferrari #50" },
        { pos: 10, name: "Nato / Stevens", team: "cadillac", pts: 50, sub: "Cadillac #12" },
      ] },
      { label: "Fabricantes", rows: teams.map(t => ({ pos: t.pos, name: t.name, team: t.id, pts: t.pts, sub: `${t.car} · ${t.ghost}` })) },
    ],
    calendarNote: "8 etapas. Catar e Bahrein foram cancelados e substituídos por Barcelona e Monza.",
    rules: {
      title: "Hypercar: duas receitas, uma classe",
      lede: "Na classe principal do WEC correm dois tipos de protótipo. A FIA equilibra os dois para que briguem pela vitória.",
      compare: {
        plain: true,
        head: ["Item", "LMH", "LMDh"],
        rows: [
          ["Chassi", "Livre, feito pelo fabricante", "Um de 4 fornecedores (Dallara, Ligier, Multimatic, Oreca)"],
          ["Sistema híbrido", "Opcional, no eixo dianteiro", "Obrigatório e padronizado, no eixo traseiro"],
          ["Tração", "Integral acima de 190 km/h (com híbrido)", "Traseira"],
          ["Carros em 2026", "Toyota, Ferrari, Peugeot, Aston Martin", "BMW, Cadillac, Alpine, Genesis"],
        ],
      },
      cards: [
        ["Balanço de performance", "Para que carros tão diferentes disputem juntos, a FIA ajusta peso e potência de cada modelo. Em 2026 essas tabelas deixaram de ser publicadas."],
        ["Duas classes na pista", "Os Hypercars brigam pela vitória geral; os GT3 (LMGT3) correm ao mesmo tempo, com pelo menos um piloto amador por carro."],
        ["Revezamento", "Cada carro tem dois ou três pilotos. Em Le Mans, ninguém pode guiar mais de 14 horas no total."],
      ],
    },
    facts: [
      { big: "10,9 s", text: "Diferença entre a Toyota #7 e a BMW #20 no fim das 24 Horas de Le Mans de 2026." },
      { big: "6", text: "Vitórias da Toyota em Le Mans. A de 2026 encerrou três anos seguidos de Ferrari." },
      { big: "27 anos", text: "Tempo que a BMW esperou por uma vitória na classe principal do endurance mundial, até Spa 2026." },
      { big: "8", text: "Fabricantes na classe Hypercar em 2026, com a estreia da Genesis." },
      { big: "Pipo", text: "Luis Felipe Derani, o Pipo Derani, é o brasileiro da classe Hypercar, no Genesis #17." },
      { big: "#83", text: "O Ferrari amarelo de Kubica, Ye e Hanson venceu Le Mans em 2025 como equipe privada." },
      { big: "V12", text: "O Aston Martin Valkyrie é o único carro do grid sem sistema híbrido." },
      { big: "5.000 km", text: "Distância aproximada percorrida pelo vencedor das 24 Horas de Le Mans." },
    ],
    footer: "Dados de fiawec.com, FIA e imprensa especializada. Imagens © FIA WEC / ACO.",
  };
})();
