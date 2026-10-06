// Fórmula 1 2026 — fonte: formula1.com, atualizado após a etapa 16 (GP do Bahrein em Sepang, 4 out 2026)
(() => {
  const IMG = "https://media.formula1.com/image/upload";
  const carImg = (slug, view, w) => `${IMG}/c_lfill,w_${w}/q_auto/v1740000001/common/f1/2026/${slug}/2026${slug}car${view}.webp`;
  // ângulos oficiais publicados pela F1 (traseira e vista de cima não existem no servidor oficial)
  const views = slug => [["right", "Lateral direita", [1200, 2400, 3840]], ["left", "Lateral esquerda", [1200, 2400, 3840]], ["front", "Frente", [800, 1500]]]
    .map(([v, label, ws]) => ({ id: v, label, img: carImg(slug, v, ws[1]), srcset: ws.map(w => `${carImg(slug, v, w)} ${w}w`).join(", ") }));
  const driverImg = (team, code, w) => `${IMG}/c_lfill,w_${w}/q_auto/v1740000001/common/f1/2026/${team}/${code}/2026${team}${code}right.webp`;
  const logoImg = slug => `${IMG}/c_lfill,w_96/q_auto/v1740000001/common/f1/2026/${slug}/2026${slug}logowhite.webp`;

  // [id, nome, nome completo, carro, cor, motor, sede, chefe, estreia, títulos, pos, pts, ratings, nota]
  const T = [
    ["mercedes", "Mercedes", "Mercedes-AMG Petronas F1 Team", "W17", "#00D7B6", "Mercedes-AMG F1 M17", "Brackley, Reino Unido", "Toto Wolff", 1954, 8, 1, 556, [97, 94, 93, 92, 96],
      "O carro a ser batido em 2026: 13 vitórias em 16 corridas. A Mercedes acertou em cheio a nova unidade de potência 50/50."],
    ["ferrari", "Ferrari", "Scuderia Ferrari HP", "SF-26", "#ED1131", "Ferrari 067/6", "Maranello, Itália", "Frédéric Vasseur", 1950, 16, 2, 405, [92, 92, 91, 88, 89],
      "A única equipe presente em todas as temporadas desde 1950. Hamilton venceu em Barcelona e Leclerc em Silverstone."],
    ["mclaren", "McLaren", "McLaren Formula 1 Team", "MCL40", "#F47600", "Mercedes-AMG F1 M17", "Woking, Reino Unido", "Andrea Stella", 1966, 10, 3, 316, [95, 90, 90, 89, 88],
      "Bicampeã de construtores em 2024 e 2025, corre com o número 1 de Lando Norris. Venceu na Hungria e na Holanda."],
    ["redbullracing", "Red Bull Racing", "Oracle Red Bull Racing", "RB22", "#4781D7", "Red Bull Ford DM01", "Milton Keynes, Reino Unido", "Laurent Mekies", 2005, 6, 4, 298, [89, 91, 89, 85, 88],
      "Primeiro ano com motor próprio, em parceria com a Ford. A primeira vitória veio só na etapa 16, com Verstappen em Sepang."],
    ["racingbulls", "Racing Bulls", "Visa Cash App Racing Bulls", "VCARB 03", "#6C98FF", "Red Bull Ford DM01", "Faenza, Itália", "Alan Permane", 2006, 0, 5, 90, [89, 82, 82, 86, 84],
      "Equipe-escola da Red Bull. Lawson e o estreante Arvid Lindblad colocaram o time na frente do pelotão intermediário."],
    ["alpine", "Alpine", "BWT Alpine F1 Team", "A526", "#00A1E8", "Mercedes-AMG F1 M17", "Enstone, Reino Unido", "Flavio Briatore", 1986, 2, 6, 68, [95, 80, 80, 87, 86],
      "Trocou o motor Renault pelo Mercedes em 2026. Os 2 títulos de construtores vieram como Renault (2005 e 2006)."],
    ["haasf1team", "Haas", "MoneyGram Haas F1 Team", "VF-26", "#9C9FA2", "Ferrari 067/6", "Kannapolis, EUA", "Ayao Komatsu", 2016, 0, 7, 27, [92, 78, 79, 85, 82],
      "Equipe americana enxuta, com forte parceria técnica com a Ferrari. Bearman é o principal pontuador."],
    ["audi", "Audi", "Audi Revolut F1 Team", "R26", "#F50537", "Audi AFR 26 Hybrid", "Hinwil, Suíça", "Jonathan Wheatley", 2026, 0, 8, 17, [84, 77, 78, 80, 80],
      "A antiga Sauber virou equipe de fábrica da Audi. O motor é feito em Neuburg, na Alemanha. Tem o brasileiro Gabriel Bortoleto."],
    ["williams", "Williams", "Atlassian Williams Racing", "FW48", "#1868DB", "Mercedes-AMG F1 M17", "Grove, Reino Unido", "James Vowles", 1977, 9, 9, 12, [95, 76, 77, 82, 83],
      "Nove títulos de construtores, o terceiro maior número da história. Sainz e Albon formam uma das duplas mais experientes do grid."],
    ["astonmartin", "Aston Martin", "Aston Martin Aramco F1 Team", "AMR26", "#229971", "Honda RA626H", "Silverstone, Reino Unido", "Adrian Newey", 2018, 0, 10, 7, [80, 79, 78, 72, 76],
      "Primeiro carro desenhado por Adrian Newey na equipe e estreia da parceria de fábrica com a Honda. Um começo difícil."],
    ["cadillac", "Cadillac", "Cadillac Formula 1 Team", "MAC-26", "#C8CCD0", "Ferrari 067/6", "Fishers, EUA / Silverstone, Reino Unido", "Graeme Lowdon", 2026, 0, 11, 0, [92, 72, 73, 80, 78],
      "A 11ª equipe do grid, a primeira nova desde a Haas em 2016. Aposta na experiência de Pérez e Bottas."],
  ];
  const teams = T.map(([id, name, full, car, color, pu, base, principal, debut, titles, pos, pts, r, note]) => ({
    id, name, full, car, color, pos, note, logo: logoImg(id),
    views: views(id),
    ptsLabel: `${pts} pts no Mundial de Construtores`, pts,
    ratings: { motor: r[0], aero: r[1], grip: r[2], confiab: r[3], energia: r[4] },
    specs: [["Chassi", car], ["Unidade de potência", pu], ["Sede", base], ["Chefe de equipe", principal], ["Na F1 desde", debut], ["Títulos de construtores", titles]],
  }));

  // [nº, nome, sobrenome, equipe, código, país, nascimento, cidade, estreia, títulos, pos, pts, vitórias, bio]
  const D = [
    [12, "Kimi", "Antonelli", "mercedes", "andant01", "Itália", "25/08/2006", "Bolonha", 2025, 0, 1, 320, 8, "Revelado pela academia da Mercedes, chegou à F1 com 18 anos. Em 2026 se tornou o mais jovem líder de campeonato da história."],
    [63, "George", "Russell", "mercedes", "georus01", "Reino Unido", "15/02/1998", "King's Lynn", 2019, 0, 2, 236, 3, "Venceu a abertura na Austrália e mais duas vezes. É o único que consegue acompanhar o ritmo do companheiro."],
    [44, "Lewis", "Hamilton", "ferrari", "lewham01", "Reino Unido", "07/01/1985", "Stevenage", 2007, 7, 3, 214, 1, "Heptacampeão e recordista de vitórias e poles. Em Barcelona conquistou a primeira vitória em GP com a Ferrari."],
    [16, "Charles", "Leclerc", "ferrari", "chalec01", "Mônaco", "16/10/1997", "Monte Carlo", 2018, 0, 4, 191, 1, "Especialista em voltas de classificação. Venceu em Silverstone em 2026."],
    [1, "Lando", "Norris", "mclaren", "lannor01", "Reino Unido", "13/11/1999", "Bristol", 2019, 1, 5, 188, 2, "Campeão de 2025, corre com o número 1. Venceu na Hungria e na Holanda em 2026."],
    [3, "Max", "Verstappen", "redbullracing", "maxver01", "Holanda", "30/09/1997", "Hasselt", 2015, 4, 6, 188, 1, "Tetracampeão. Trocou o 33 pelo 3 em 2026 e deu à Red Bull a primeira vitória da nova era em Sepang."],
    [81, "Oscar", "Piastri", "mclaren", "oscpia01", "Austrália", "06/04/2001", "Melbourne", 2023, 0, 7, 128, 0, "Campeão de F3 e F2 em anos seguidos. Chegou a liderar o campeonato de 2025 por boa parte do ano."],
    [6, "Isack", "Hadjar", "redbullracing", "isahad01", "França", "28/09/2004", "Paris", 2025, 0, 8, 96, 0, "Promovido à Red Bull após uma temporada de estreia sólida na Racing Bulls, com pódio na Holanda em 2025."],
    [30, "Liam", "Lawson", "racingbulls", "lialaw01", "Nova Zelândia", "11/02/2002", "Hastings", 2023, 0, 9, 65, 0, "Agressivo nas disputas roda a roda, é o líder da Racing Bulls em 2026."],
    [10, "Pierre", "Gasly", "alpine", "piegas01", "França", "07/02/1996", "Rouen", 2017, 0, 10, 41, 0, "Vencedor do GP da Itália de 2020 pela AlphaTauri. Referência da Alpine na era do motor Mercedes."],
    [41, "Arvid", "Lindblad", "racingbulls", "arvlin01", "Reino Unido", "08/08/2007", "Virginia Water", 2026, 0, 11, 38, 0, "Único estreante de 2026. Começou a temporada com 18 anos e já pontua com frequência."],
    [43, "Franco", "Colapinto", "alpine", "fracol01", "Argentina", "27/05/2003", "Pilar", 2024, 0, 12, 27, 0, "Ídolo da torcida argentina. Estreou pela Williams no meio de 2024."],
    [87, "Oliver", "Bearman", "haasf1team", "olibea01", "Reino Unido", "08/05/2005", "Chelmsford", 2024, 0, 13, 20, 0, "Estreou substituindo Sainz na Ferrari em Jeddah 2024 e pontuou logo na primeira corrida."],
    [5, "Gabriel", "Bortoleto", "audi", "gabbor01", "Brasil", "14/10/2004", "Osasco", 2025, 0, 14, 10, 0, "Campeão de F3 e F2 em anos seguidos. Primeiro brasileiro titular na F1 desde Felipe Massa em 2017."],
    [27, "Nico", "Hülkenberg", "audi", "nichul01", "Alemanha", "19/08/1987", "Emmerich", 2010, 0, 15, 7, 0, "Veterano com mais de 230 GPs. Conquistou o primeiro pódio da carreira em Silverstone, em 2025."],
    [31, "Esteban", "Ocon", "haasf1team", "estoco01", "França", "17/09/1996", "Évreux", 2016, 0, 16, 7, 0, "Vencedor do GP da Hungria de 2021 pela Alpine. Traz experiência à Haas."],
    [14, "Fernando", "Alonso", "astonmartin", "feralo01", "Espanha", "29/07/1981", "Oviedo", 2001, 2, 17, 7, 0, "Bicampeão em 2005 e 2006 e piloto com mais largadas na história da F1. Aos 45 anos, segue no grid."],
    [55, "Carlos", "Sainz", "williams", "carsai01", "Espanha", "01/09/1994", "Madri", 2015, 0, 18, 7, 0, "Quatro vitórias na carreira. Lidera o projeto de reconstrução da Williams."],
    [23, "Alexander", "Albon", "williams", "alealb01", "Tailândia", "23/03/1996", "Londres", 2019, 0, 19, 5, 0, "Nascido em Londres, corre pela Tailândia. Conhecido por extrair pontos de carros difíceis."],
    [18, "Lance", "Stroll", "astonmartin", "lanstr01", "Canadá", "29/10/1998", "Montreal", 2017, 0, 21, 0, 0, "Fez pódio no ano de estreia, em Baku 2017, aos 18 anos."],
    [77, "Valtteri", "Bottas", "cadillac", "valbot01", "Finlândia", "28/08/1989", "Nastola", 2013, 0, 22, 0, 0, "Dez vitórias pela Mercedes. Voltou ao grid como titular para o projeto da Cadillac."],
    [11, "Sergio", "Pérez", "cadillac", "serper01", "México", "26/01/1990", "Guadalajara", 2011, 0, 23, 0, 0, "Seis vitórias, vice-campeão em 2023. Retornou após um ano fora para liderar a Cadillac."],
  ];
  const drivers = D.map(([n, first, last, team, code, country, born, place, debut, titles, pos, pts, wins, bio]) => ({
    n, first, last, team, country, born, place, debut, titles, pos, pts, wins, bio,
    img: driverImg(team, code, 520), imgFull: driverImg(team, code, 700),
  }));

  const C = [
    [1, "Austrália", "Albert Park", "08 mar", "Russell", "mercedes"], [2, "China", "Xangai", "15 mar", "Antonelli", "mercedes"],
    [3, "Japão", "Suzuka", "29 mar", "Antonelli", "mercedes"], [4, "Miami", "Miami International Autodrome", "03 mai", "Antonelli", "mercedes"],
    [5, "Canadá", "Gilles Villeneuve", "24 mai", "Antonelli", "mercedes"], [6, "Mônaco", "Monte Carlo", "07 jun", "Antonelli", "mercedes"],
    [7, "Barcelona-Catalunha", "Barcelona-Catalunya", "14 jun", "Hamilton", "ferrari"], [8, "Áustria", "Red Bull Ring", "28 jun", "Russell", "mercedes"],
    [9, "Grã-Bretanha", "Silverstone", "05 jul", "Leclerc", "ferrari"], [10, "Bélgica", "Spa-Francorchamps", "19 jul", "Antonelli", "mercedes"],
    [11, "Hungria", "Hungaroring", "26 jul", "Norris", "mclaren"], [12, "Holanda", "Zandvoort", "23 ago", "Norris", "mclaren"],
    [13, "Itália", "Monza", "06 set", "Antonelli", "mercedes"], [14, "Espanha", "Madring, Madri", "13 set", "Antonelli", "mercedes"],
    [15, "Azerbaijão", "Baku", "26 set", "Russell", "mercedes"], [16, "Bahrein (em Sepang)", "Sepang, Malásia", "04 out", "Verstappen", "redbullracing"],
    [17, "Singapura", "Marina Bay", "11 out"], [18, "Estados Unidos", "Circuito das Américas", "25 out"],
    [19, "Cidade do México", "Hermanos Rodríguez", "01 nov"], [20, "São Paulo", "Interlagos", "08 nov"],
    [21, "Las Vegas", "Las Vegas Strip", "21 nov"], [22, "Catar", "Lusail", "29 nov"], [23, "Abu Dhabi", "Yas Marina", "06 dez"],
  ];
  const calendar = C.map(([r, gp, circuit, date, winner, team]) => ({ r, gp, circuit, date, winner, team }));
  Object.assign(calendar[16], { start: "2026-10-11T12:00:00Z", pill: "GP de Singapura" });

  SERIES.f1 = {
    id: "f1", name: "Fórmula 1", short: "F1", season: "2026", accent: "#E10600",
    status: "Antonelli lidera com 84 pts de vantagem",
    updated: "Atualizado após a etapa 16, GP do Bahrein (Sepang), 4 de outubro de 2026.",
    labels: { rules: "Regras 2026" },
    garageLede: "Os 11 carros de 2026. Escolha uma equipe para ver o carro, a ficha técnica e o desempenho.",
    peopleLede: "Os 22 titulares, na ordem do campeonato. Toque em um piloto para ver o perfil.",
    debutLabel: "Estreia na F1",
    stageMaxW: 1500, card: { w: "86%", top: "8%" },
    hero: {
      kind: "cutout", color: "#00D7B6", number: "12",
      kicker: "Líder do campeonato · após 16 de 23 etapas", first: "Kimi", last: "Antonelli",
      lede: "Aos 20 anos, o italiano da Mercedes lidera 2026 com 84 pontos de vantagem sobre George Russell e é o mais jovem líder de campeonato da história.",
      stats: [["Pontos", "320"], ["Vitórias", "8"], ["Vantagem", "+84"]],
      img: driverImg("mercedes", "andant01", 1100), alt: "Kimi Antonelli com o macacão da Mercedes",
    },
    teams, drivers, calendar,
    ratingLabels: { motor: "Motor", aero: "Aerodinâmica", grip: "Aderência mecânica", confiab: "Confiabilidade", energia: "Gestão de energia" },
    commonSpecs: [
      ["Motor", "V6 1,6 L turbo + híbrido"], ["Potência combustão", "≈ 400 kW (≈ 540 cv)"], ["Potência elétrica (MGU-K)", "350 kW (≈ 470 cv)"],
      ["Potência total", "≈ 1.000 cv"], ["Câmbio", "8 marchas, semiautomático sequencial"], ["Peso mínimo", "768 kg (com piloto, sem combustível)"],
      ["Entre-eixos máximo", "3.400 mm"], ["Largura", "1.900 mm"], ["Pneus", "Pirelli 18\", mais estreitos que em 2025"],
      ["Combustível", "100% sustentável"], ["Velocidade máxima", "≈ 350 km/h (modo reta)"],
    ],
    standings: [
      { label: "Pilotos", rows: [...drivers.map(d => ({ pos: d.pos, name: `${d.first} ${d.last}`, team: d.team, pts: d.pts })),
        { pos: 20, name: "Yuki Tsunoda", team: "racingbulls", pts: 1 }].sort((a, b) => a.pos - b.pos) },
      { label: "Construtores", rows: teams.map(t => ({ pos: t.pos, name: t.name, team: t.id, pts: t.pts, sub: `${t.car} · ${t.specs[1][1]}` })) },
    ],
    calendarNote: "23 etapas. Bahrein e Arábia Saudita foram canceladas em abril; o GP do Bahrein voltou em outubro, disputado em Sepang.",
    rules: {
      title: "A nova era: regras de 2026",
      lede: "A maior mudança técnica em décadas. Carros menores e mais leves, metade da potência vinda da bateria e asas que mudam de posição.",
      compare: {
        head: ["Item", "2025", "2026"],
        rows: [
          ["Peso mínimo", "800 kg", "768 kg"], ["Entre-eixos", "3.600 mm", "3.400 mm"], ["Largura", "2.000 mm", "1.900 mm"],
          ["Potência elétrica", "120 kW", "350 kW"], ["Divisão combustão/elétrico", "≈ 80/20", "≈ 50/50"], ["MGU-H", "Sim", "Removido"],
          ["Ultrapassagem", "DRS", "Modo de ultrapassagem (energia extra)"], ["Asas", "Fixas + DRS", "Aerodinâmica ativa (modo curva / modo reta)"],
          ["Combustível", "E10", "100% sustentável"],
        ],
      },
      cards: [
        ["Aerodinâmica ativa", "Asas dianteira e traseira têm duas posições. Nas retas abrem para cortar o arrasto; nas curvas fecham para gerar pressão aerodinâmica. Todos podem usar, não só quem ataca."],
        ["Modo de ultrapassagem", "Substitui o DRS. Quem está a menos de um segundo do carro da frente ganha energia elétrica extra para atacar."],
        ["Motor 50/50", "O MGU-K quase triplica de potência e o MGU-H sai. Administrar a bateria ao longo da volta virou parte da pilotagem."],
      ],
    },
    facts: [
      { big: "1,80 s", text: "O pit stop mais rápido da história: McLaren, no GP do Catar de 2023, com Lando Norris." },
      { big: "13/16", text: "A Mercedes venceu 13 das 16 primeiras corridas da nova era. Antonelli venceu 8 delas." },
      { big: "Sepang", text: "O GP do Bahrein de 2026 foi disputado na Malásia. Não é inédito: já houve GP de Luxemburgo em Nürburgring e GP de San Marino em Ímola." },
      { big: "3 kg", text: "É quanto um piloto pode perder em líquido no GP de Singapura, a corrida mais quente e úmida do ano." },
      { big: "1.000 °C", text: "Temperatura que os discos de freio de carbono podem passar nas frenagens mais fortes." },
      { big: "11", text: "Equipes no grid pela primeira vez desde 2016, com a chegada da Cadillac." },
      { big: "−32 kg", text: "Os carros de 2026 são 32 kg mais leves que os de 2025, além de mais curtos e mais estreitos." },
      { big: "1950", text: "A Ferrari é a única equipe presente em todas as temporadas da história da F1." },
      { big: "5 G", text: "Força que o piloto suporta em frenagens fortes: o corpo pesa 5 vezes mais por um instante." },
      { big: "8 nov", text: "GP de São Paulo em Interlagos, a corrida de casa de Gabriel Bortoleto." },
    ],
    footer: "Dados de formula1.com. Imagens © Formula One World Championship Limited.",
  };
})();
