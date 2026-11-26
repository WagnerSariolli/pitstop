// WRC 2026 (classe Rally1) — fontes: FIA, wrc.com e Wikipedia; classificação final após o Rali da Sardenha (4 out 2026)
// Fotos: Wikimedia Commons (licença livre), convertidas para WebP em img/wrc. Os créditos ficam no rodapé e na galeria (data/media.js).
(() => {
  const P = f => `img/wrc/${f}.webp`;

  // [id, nome, equipe, carro, cor, base, pos, pts, vitórias, ratings, foto, nota]
  const T = [
    ["toyota", "Toyota", "Toyota Gazoo Racing WRT", "GR Yaris Rally1", "#EB0A1E", "Jyväskylä, Finlândia", 1, 662, 9, [96, 95, 95, 90, 96], "toyota",
      "Campeã de construtores pela sexta vez seguida, chegou a dez títulos e igualou o recorde da Lancia. Somando a equipe-satélite, os Yaris venceram 12 dos 13 ralis."],
    ["hyundai", "Hyundai", "Hyundai Shell Mobis WRT", "i20 N Rally1", "#2F6FE4", "Alzenau, Alemanha", 2, 440, 1, [91, 88, 91, 82, 87], "hyundai",
      "Só uma vitória no ano, com Neuville em Portugal. Fourmaux foi o 5º do campeonato sem vencer; o terceiro carro foi dividido entre Lappi, Sordo e Paddon."],
    ["toyota2", "Toyota 2", "Toyota Gazoo Racing WRT2", "GR Yaris Rally1", "#8A919C", "Jyväskylä, Finlândia", 3, 251, 3, [94, 95, 89, 92, 86], "toyota2",
      "A equipe-satélite da Toyota, com um carro só. Sami Pajari e Marko Salminen venceram três ralis seguidos: Estônia, Finlândia e Paraguai."],
    ["msport", "M-Sport Ford", "M-Sport Ford WRT", "Puma Rally1", "#1FA35B", "Cockermouth, Reino Unido", 4, 168, 0, [82, 83, 80, 80, 77], "msport",
      "Apostou em dois jovens da Irlanda, McErlean e Armstrong. Em Monte Carlo a equipe ficou sem pontos pela primeira vez em 24 anos."],
  ];
  const teams = T.map(([id, name, full, car, color, base, pos, pts, wins, r, img, note]) => ({
    id, name, full, car, color, pos, pts, note, img: P(img), ghost: "Rally1",
    views: [{ id: "acao", label: "Em ação", img: P(img) }],
    ptsLabel: `${pts} pts entre os construtores · ${wins} ${wins === 1 ? "vitória" : "vitórias"}`,
    ratings: { vel: r[0], terra: r[1], asfalto: r[2], confiab: r[3], duplas: r[4] },
    specs: [["Carro", car], ["Base", base], ["Vitórias na temporada", wins]],
  }));

  // duplas: [nº, nome, sobrenome, navegador, equipe, país, títulos, pos, pts, vitórias, ralis, vitórias carreira, pódios carreira, foto, bio]
  const D = [
    [33, "Elfyn", "Evans", "Scott Martin", "toyota", "Reino Unido", 1, 1, 243, 2, 169, 13, 51, "evans",
      "Campeão de 2026 na última especial do ano, depois de cinco vices. É o primeiro britânico campeão mundial de rali desde Richard Burns, em 2001."],
    [99, "Oliver", "Solberg", "Elliott Edmondson", "toyota", "Suécia", 0, 2, 238, 3, 71, 4, 7, "solberg",
      "Filho do campeão de 2003, Petter Solberg. Na primeira temporada completa venceu Monte Carlo, Chile e Sardenha, e perdeu o título por 5 pontos."],
    [5, "Sami", "Pajari", "Marko Salminen", "toyota2", "Finlândia", 0, 3, 237, 3, 70, 3, 10, "pajari",
      "Primeiro piloto a conquistar as três primeiras vitórias da carreira em três ralis seguidos: Estônia, Finlândia e Paraguai. Terminou a 6 pontos do título."],
    [1, "Sébastien", "Ogier", "Vincent Landais", "toyota", "França", 9, 4, 189, 2, 214, 69, 121, "toyota",
      "Eneacampeão mundial, correu com o número 1 de campeão de 2025. Fez temporada parcial, com 11 ralis, e ainda venceu nas Canárias e na Grécia."],
    [16, "Adrien", "Fourmaux", "Alexandre Coria", "hyundai", "França", 0, 5, 183, 0, 75, 0, 10, "fourmaux",
      "O mais regular da Hyundai: pontuou nos 13 ralis e terminou em 5º, ainda à procura da primeira vitória."],
    [18, "Takamoto", "Katsuta", "Aaron Johnston", "toyota", "Japão", 0, 6, 175, 2, 91, 2, 10, "katsuta",
      "Depois de dez anos tentando, venceu pela primeira vez no Safari, no Quênia, e repetiu na Croácia, quando chegou a liderar o campeonato."],
    [11, "Thierry", "Neuville", "Martijn Wydaeghe", "hyundai", "Bélgica", 1, 7, 134, 1, 195, 23, 76, "neuville",
      "Campeão de 2024. Deu à Hyundai a única vitória do ano, em Portugal, mas perdeu a Croácia e a Grécia quando liderava."],
    [55, "Josh", "McErlean", "Eoin Treacy", "msport", "Irlanda", 0, 9, 35, 0, 41, 0, 0, "msport",
      "Segunda temporada no Rally1, formado pela academia de ralis da Irlanda. Foi o melhor piloto da Ford no campeonato."],
    [95, "Jon", "Armstrong", "Shane Byrne", "msport", "Irlanda", 0, 12, 22, 0, 13, 0, 0, "armstrong",
      "Estreante no Rally1, veio do campeonato europeu. Fez a primeira vitória em especial na temporada de estreia."],
    [22, "Mārtiņš", "Sesks", "Renārs Francis", "msport", "Letônia", 0, 16, 12, 0, 24, 0, 0, "sesks",
      "O letão correu seis ralis com um terceiro Puma, em programa parcial."],
  ];
  const drivers = D.map(([n, first, last, codriver, team, country, titles, pos, pts, wins, rallies, cw, cp, photo, bio]) => ({
    n, first, last, team, country, titles, pos, pts, wins, bio, img: P(photo),
    extra: [["Navegador", codriver], ["Ralis na carreira", rallies], ["Vitórias na carreira", cw], ["Pódios na carreira", cp]],
  }));

  const R = [
    [1, "Rali de Monte Carlo", "Gap, França · asfalto e neve", "25 jan", "Solberg", "toyota"],
    [2, "Rali da Suécia", "Umeå, Suécia · neve", "15 fev", "Evans", "toyota"],
    [3, "Safari Rali Quênia", "Nairóbi, Quênia · terra", "15 mar", "Katsuta", "toyota"],
    [4, "Rali da Croácia", "Rijeka, Croácia · asfalto", "12 abr", "Katsuta", "toyota"],
    [5, "Rali das Ilhas Canárias", "Las Palmas, Espanha · asfalto", "26 abr", "Ogier", "toyota"],
    [6, "Rali de Portugal", "Matosinhos, Portugal · terra", "10 mai", "Neuville", "hyundai"],
    [7, "Rali do Japão", "Toyota, Japão · asfalto", "31 mai", "Evans", "toyota"],
    [8, "Rali Acrópole", "Loutraki, Grécia · terra", "28 jun", "Ogier", "toyota"],
    [9, "Rali da Estônia", "Tartu, Estônia · terra", "19 jul", "Pajari", "toyota2"],
    [10, "Rali da Finlândia", "Jyväskylä, Finlândia · terra", "02 ago", "Pajari", "toyota2"],
    [11, "Rali do Paraguai", "Encarnación, Paraguai · terra", "30 ago", "Pajari", "toyota2"],
    [12, "Rali do Chile", "Talcahuano, Chile · terra", "13 set", "Solberg", "toyota"],
    [13, "Rali da Sardenha", "Alghero, Itália · terra", "04 out", "Solberg", "toyota"],
  ];
  const calendar = R.map(([r, gp, circuit, date, winner, team]) => ({ r, gp, circuit, date, winner, team }));

  SERIES.wrc = {
    id: "wrc", name: "WRC / Rali", short: "WRC", season: "2026", accent: "#FF6A13", seasonOver: true, photo: true,
    offSeason: "Temporada encerrada · nova era em 2027",
    status: "Evans campeão por 5 pontos; Toyota campeã de construtores",
    updated: "Classificação final de 2026, após o Rali da Sardenha, 4 de outubro de 2026.",
    labels: { people: "Duplas", vehicle: "carro" },
    garageLede: "As 4 equipes que pontuaram entre os construtores com carros Rally1. Escolha uma para ver o carro, a ficha técnica e o desempenho.",
    peopleLede: "As duplas de piloto e navegador que mais se destacaram, na ordem final do campeonato. O terceiro Hyundai foi dividido entre Paddon, Lappi e Sordo, que aparecem na classificação.",
    stageMaxW: 1200, card: { w: "100%", top: "0" },
    hero: {
      kind: "photo", color: "#EB0A1E", number: "33",
      kicker: "Campeão mundial de 2026", first: "Elfyn", last: "Evans",
      lede: "O galês da Toyota chegou à última especial do ano um ponto à frente de Oliver Solberg e terminou à frente dele no Power Stage da Sardenha. Depois de cinco vice-campeonatos, enfim o título, com o navegador Scott Martin.",
      stats: [["Pontos", "243"], ["Vitórias", "2"], ["Vantagem", "+5"]],
      img: P("evans"), alt: "Toyota GR Yaris Rally1 de Elfyn Evans levantando poeira numa estrada de terra à beira-mar, no Rali da Sardenha",
    },
    teams, drivers, calendar,
    ratingLabels: { vel: "Velocidade", terra: "Terra e neve", asfalto: "Asfalto", confiab: "Confiabilidade", duplas: "Força das duplas" },
    commonSpecs: [
      ["Motor", "1,6 L turbo, 4 cilindros"], ["Híbrido", "Retirado em 2025 (usado de 2022 a 2024)"],
      ["Tração", "Integral"], ["Câmbio", "Sequencial de 5 marchas"], ["Estrutura", "Chassi tubular de segurança, com silhueta de carro de rua"],
      ["Pneus", "Hankook"], ["Tripulação", "Piloto e navegador"],
    ],
    standings: [
      { label: "Pilotos", note: "Top 10 do campeonato de pilotos.", rows: [
        { pos: 1, name: "Elfyn Evans", team: "toyota", pts: 243, sub: "Toyota #33" },
        { pos: 2, name: "Oliver Solberg", team: "toyota", pts: 238, sub: "Toyota #99" },
        { pos: 3, name: "Sami Pajari", team: "toyota2", pts: 237, sub: "Toyota #5" },
        { pos: 4, name: "Sébastien Ogier", team: "toyota", pts: 189, sub: "Toyota #1" },
        { pos: 5, name: "Adrien Fourmaux", team: "hyundai", pts: 183, sub: "Hyundai #16" },
        { pos: 6, name: "Takamoto Katsuta", team: "toyota", pts: 175, sub: "Toyota #18" },
        { pos: 7, name: "Thierry Neuville", team: "hyundai", pts: 134, sub: "Hyundai #11" },
        { pos: 8, name: "Hayden Paddon", team: "hyundai", pts: 38, sub: "Hyundai #20" },
        { pos: 9, name: "Josh McErlean", team: "msport", pts: 35, sub: "Ford #55" },
        { pos: 10, name: "Esapekka Lappi", team: "hyundai", pts: 33, sub: "Hyundai #4" },
      ] },
      { label: "Construtores", rows: teams.map(t => ({ pos: t.pos, name: t.full, team: t.id, pts: t.pts, sub: t.car })) },
    ],
    calendarNote: "13 ralis em quatro continentes, de janeiro a outubro. O Rali da Arábia Saudita, marcado para novembro, saiu do calendário e a Sardenha virou a final.",
    rules: {
      title: "Rally1 se despede; 2027 traz outro carro",
      lede: "2026 foi o último ano dos Rally1 como foram criados em 2022. A partir de 2027 entra um regulamento novo, pensado para baratear os carros e atrair mais fabricantes.",
      compare: {
        plain: true,
        head: ["Item", "Rally1 (2022–2026)", "Regulamento de 2027"],
        rows: [
          ["Chassi", "Próprio de cada fabricante", "Padrão, fornecido pela FIA"],
          ["Mecânica", "Motor 1,6 turbo de cada marca", "Peças baseadas no Rally2"],
          ["Carroceria", "Silhueta de um carro de rua", "Pode ser um desenho próprio"],
          ["Híbrido", "De 2022 a 2024", "Não"],
        ],
      },
      cards: [
        ["Pontos", "Os dez primeiros pontuam (25, 17, 15, 12, 10, 8, 6, 4, 2, 1). Há ainda bônus de 5 a 1 ponto para os mais rápidos no domingo e no Power Stage."],
        ["Power Stage", "A última especial de cada rali vale pontos extras para os cinco mais rápidos. Foi nela que Evans tirou o título de Solberg na Sardenha."],
        ["Contra o relógio", "Os carros largam um por vez, em trechos fechados chamados especiais. Vence quem somar o menor tempo; o navegador dita as curvas pelas anotações."],
      ],
    },
    facts: [
      { big: "5 pts", text: "Diferença entre Evans e Solberg no fim do campeonato. Pajari, o terceiro, ficou a 6." },
      { big: "2001", text: "Último título britânico antes de Evans, com Richard Burns." },
      { big: "10", text: "Títulos de construtores da Toyota, igualando o recorde da Lancia. Foi o sexto seguido." },
      { big: "3 em 3", text: "Sami Pajari conquistou as três primeiras vitórias da carreira em três ralis seguidos, algo inédito." },
      { big: "69", text: "Vitórias de Sébastien Ogier, o eneacampeão, que fez 11 dos 13 ralis em 2026." },
      { big: "20 de 20", text: "Especiais do Rali do Japão vencidas pela Toyota, que corria em casa." },
      { big: "12 de 13", text: "Ralis vencidos por um Toyota GR Yaris em 2026. Só a Hyundai, em Portugal, quebrou a sequência." },
      { big: "10 h", text: "Descanso mínimo que passou a ser obrigatório em cada fim de semana de rali em 2026." },
    ],
    footer: "Dados da FIA, de wrc.com e da Wikipedia. Fotos da Wikimedia Commons: Antti Leppänen, Geonich e AnDr0 Gr0zNy (CC BY 4.0); Cardoesvroom e TTTNIS (CC0).",
  };
})();
