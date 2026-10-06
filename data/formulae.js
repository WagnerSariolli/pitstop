// Fórmula E, temporada 12 (2025/26) — fonte: fiaformulae.com, classificação final após Londres (16 ago 2026)
(() => {
  const CF = "https://contentfulproxy.stadion.io/eag9z2l5md8w";
  const img = (path, q = "") => `${CF}/${path}${q}`;

  // [id, nome, nome completo, powertrain, cor, pos, pts, vitórias, ratings, carro, nota]
  const T = [
    ["jaguar", "Jaguar", "Jaguar TCS Racing", "Jaguar", "#C0C6CF", 1, 288, 3, [93, 92, 91, 92, 91],
      "3rIy7OMC9kMBDzTATmdVEV/5338c701de10f8c4ec202de43bb604a8/05dab754-2899-411b-9c4e-72311a36cc9c_2x.png",
      "Campeã de equipes. Evans e Da Costa venceram três corridas e pontuaram com regularidade."],
    ["porsche", "Porsche", "Porsche Formula E Team", "Porsche", "#5B2BE0", 2, 271, 4, [95, 93, 92, 90, 92],
      "7eYOHK9Qm2oxmHnqp4ey0z/1a7aae307506956ad91130d610b9c5ab/0d4e7ec1-bbce-478f-b187-6e30df1127d4_2x.png",
      "Bicampeã de fabricantes. Wehrlein foi campeão com três vitórias, inclusive a penúltima corrida, em Londres."],
    ["mahindra", "Mahindra", "Mahindra Racing", "Mahindra", "#C8102E", 3, 252, 3, [90, 91, 90, 91, 89],
      "2Krf2h2ypI54XP3TMlFcBb/a0e9c16888cc64f5d0131da67a8ca7ba/fa97d2e7-02ca-4983-a930-4fdaa245a852_2x.png",
      "A grande surpresa do ano. Nyck de Vries venceu três vezes, inclusive em Mônaco."],
    ["andretti", "Andretti", "Andretti Formula E", "Porsche (cliente)", "#2F7DE1", 4, 229, 2, [92, 90, 89, 90, 88],
      "2FUGtr4JcjQyAeYjmmBtLk/9a68552b5b154ad379c3f83964053efe/0a33d76e-64e6-4823-b70b-27b79a48679c_2x.png",
      "Jake Dennis foi vice-campeão por 5 pontos. Tem o brasileiro Felipe Drugovich, que segue no time para a era Gen4."],
    ["citroen", "Citroën", "Citroën Racing", "Stellantis", "#FF5A36", 5, 182, 1, [88, 88, 88, 87, 87],
      "1YZx1jEwkxoMRkRWsMN73d/7fe6f7043f64329b9aafbb2f3b3a0d41/f016b463-3b18-4f0b-b2a8-d28067cf3562_2x.png",
      "Estreante na temporada 12, com a dupla experiente Cassidy e Vergne. Venceu na Cidade do México."],
    ["nissan", "Nissan", "Nissan Formula E Team", "Nissan", "#FF4DA6", 6, 157, 1, [89, 89, 92, 86, 88],
      "7sYppMjBcg15jIAuwMvcvx/3fdd81a530dc1c0fb1372a85f2b8f0b6/6c04a435-8357-42f6-8360-5305d00050ee_2x.png",
      "Corre com o número 1 do campeão de 2024/25, Oliver Rowland. Venceu em Mônaco."],
    ["envision", "Envision", "Envision Racing", "Jaguar (cliente)", "#00A651", 7, 152, 0, [87, 88, 86, 87, 86],
      "5WoSjSb7qjd1tQsHHwTaKl/3e623b9a34bea665ca44eba60ffd3728/c63aedad-a141-4ebc-9794-41a37909ef0c_2x.png",
      "Equipe com foco em sustentabilidade, liderada pelo veterano Sébastien Buemi, campeão de 2015/16."],
    ["cupra", "Cupra Kiro", "Cupra Kiro", "Porsche (cliente)", "#C4875A", 8, 128, 1, [87, 85, 86, 85, 85],
      "3NY62qGnXCuZKK6LsxVrrA/9c9ef99df53c3a55177fc5e2b72acdfc/5d9905e8-5348-441c-a3be-b14e145c127d_2x.png",
      "Dan Ticktum venceu em Tóquio. O jovem Josep Maria Martí completa a dupla."],
    ["dspenske", "DS Penske", "DS Penske", "Stellantis (DS)", "#D4AF37", 9, 91, 1, [86, 85, 87, 84, 85],
      "7vEs1UJoUfnNvyQvv2UGKt/b6c97db8e6c0881b32a22ece7e2401aa/e05ede6d-d065-497b-a298-85afeeeb2ab1_2x.png",
      "Taylor Barnard fechou a temporada vencendo a última corrida, em Londres."],
    ["lola", "Lola Yamaha ABT", "Lola Yamaha ABT Formula E Team", "Lola-Yamaha", "#1EC8E6", 10, 35, 1, [82, 82, 83, 80, 82],
      "4Eh2yCKjNIlMaTzZMHdwAX/8db97d509ab58d5770a28f4d46fcb2fa/f7a73b7a-3a38-421e-803a-e764a489ff1c_2x.png",
      "Projeto novo da histórica Lola com motor Yamaha. Lucas di Grassi deu ao time a vitória em Xangai."],
  ];
  const teams = T.map(([id, name, full, pu, color, pos, pts, wins, r, car, note]) => ({
    id, name, full, car: "Gen3 Evo", color, pos, pts, note, img: img(car), ghost: name,
    ptsLabel: `${pts} pts no campeonato de equipes · ${wins} ${wins === 1 ? "vitória" : "vitórias"}`,
    ratings: { potencia: r[0], efic: r[1], quali: r[2], corrida: r[3], confiab: r[4] },
    specs: [["Carro", "Spark Gen3 Evo"], ["Powertrain", pu], ["Vitórias na temporada", wins]],
  }));

  // [nº, nome, sobrenome, equipe, país, títulos, pos, pts, vitórias, largadas, vitórias carreira, pódios carreira, foto, bio]
  const D = [
    [94, "Pascal", "Wehrlein", "porsche", "Alemanha", 2, 1, 169, 3, 113, 11, 24, "33JndAFtyYZkujZKhsJjTC/573472bf1ffad48757c07cd1d51a1880/4b62fd44-831d-4b01-9f11-2aaf2c47075c.png", "Bicampeão: só o segundo piloto com dois títulos na história da Fórmula E."],
    [27, "Jake", "Dennis", "andretti", "Reino Unido", 1, 2, 164, 2, 96, 8, 29, "KkYXThcEapBbxhY1JZaXE/7918e7bbf6d248787772a0226b361462/6c47b61a-5bb4-4ae4-9e0a-63a411de0782.png", "Campeão de 2022/23. Venceu a abertura em São Paulo e foi vice por 5 pontos."],
    [9, "Mitch", "Evans", "jaguar", "Nova Zelândia", 0, 3, 160, 2, 143, 16, 38, "f1BBN3z4xK8SlEfg3U6n1/cd9aedd808ffc850e2f3fd9919a1c6f8/2543b91c-2543-4835-b9fc-17b5fbc79cb1.png", "Maior vencedor da história da Fórmula E, com 16 vitórias, mas ainda sem título."],
    [1, "Oliver", "Rowland", "nissan", "Reino Unido", 1, 4, 137, 1, 112, 8, 26, "3WiDfcilpS0L8W2C8FfKE7/7f99141508e3da5d0f117044f0d38c7b/00098f8a-69be-4f84-a7ac-baedcc5f9e9c.png", "Campeão de 2024/25, defendeu o número 1. Venceu em Mônaco."],
    [48, "Edoardo", "Mortara", "mahindra", "Suíça", 0, 5, 137, 0, 128, 6, 18, "7hdUEkIWWba83DLq5GFY4V/4244befa227f1f42f442a14c847cafab/728b2253-b9d4-47dd-9051-e970bff2a62f.png", "Vice-campeão em 2021/22. Pódio na última corrida do ano."],
    [13, "António", "Félix da Costa", "jaguar", "Portugal", 1, 6, 128, 1, 161, 14, 32, "7gklvYWlaRwFWsP4IULDFV/32613f175249cc58f041426c9965e608/fcc99980-3e5d-4a96-856a-8773641ceebe.png", "Campeão de 2019/20. Também corre no WEC pela Alpine."],
    [21, "Nyck", "de Vries", "mahindra", "Holanda", 1, 7, 115, 3, 86, 6, 15, "op8ZODBmavQ2lSw1uzMMV/5f492f11156608495724018eb748d4fb/8bd68290-c0ad-43b6-a1ce-ee162b7d8914.png", "Campeão de 2020/21 e ex-F1. Três vitórias em 2026 e campeão de Le Mans com a Toyota."],
    [37, "Nick", "Cassidy", "citroen", "Nova Zelândia", 0, 8, 114, 1, 96, 12, 30, "6nUdEGkTd2EgQXUxBtquVa/6e21a7d41f22d1a660efa3a2f68913fb/47579af2-ce5a-4ba9-800b-b6821ca934e3.png", "Doze vitórias na carreira. Deu à Citroën a primeira vitória, na Cidade do México."],
    [51, "Nico", "Müller", "porsche", "Suíça", 0, 9, 102, 1, 80, 1, 3, "7uAHZqVmfVHVLZnHA4SV0U/0c13afab090d271cee6cf32c6ec0979e/d8e6e6f6-4bce-4848-860b-8d88383983d1.png", "Conquistou a primeira vitória na Fórmula E em Berlim, em 2026."],
    [16, "Sébastien", "Buemi", "envision", "Suíça", 1, 10, 97, 0, 160, 14, 36, "4fOhkCgKe3jFD6qoANE1aE/b33f9a6465da2c5f6ac54422efe33fbb/d001837f-806a-4ccf-adac-3f5dccee21ed.png", "Campeão de 2015/16 e líder do WEC pela Toyota."],
    [77, "Taylor", "Barnard", "dspenske", "Reino Unido", 0, 11, 68, 1, 36, 1, 6, "3WB9Ni9UXal1Z2Nw6k4L2A/26878c1841949bf1f2ae25a4fbaf3677/dc2f3772-e0d8-4e10-9948-d6c23a35e501.png", "Primeira vitória na carreira na última corrida da temporada, em Londres."],
    [25, "Jean-Éric", "Vergne", "citroen", "França", 2, 12, 68, 0, 163, 11, 39, "35aPbFhprxoaKKsW4ljFD3/5f50539e8789ae542089047d87761a8e/3d5b4033-31b9-442b-a0b5-183d51ebde5e.png", "Primeiro bicampeão da história (2017/18 e 2018/19)."],
    [3, "Josep Maria", "Martí", "cupra", "Espanha", 0, 13, 66, 0, 17, 0, 2, "7I43l8oSp2Ynj1uq3akxI2/a06284dfc9becf9e95f0b13ede202f77/05632f83-e071-4bbf-b7ab-7245976e59ec.png", "Ex-F2, segunda temporada na categoria."],
    [28, "Felipe", "Drugovich", "andretti", "Brasil", 0, 14, 65, 0, 19, 0, 1, "6ZDmfbOyCSEnwyrFsj4Gjz/ca4a98ecdc5b46b04f599631828c3ad1/da1d5184-3792-43f4-b723-89bc304e9b9a.png", "Campeão da F2 em 2022 e ex-reserva da Aston Martin na F1. Renovou com a Andretti para a era Gen4."],
    [33, "Dan", "Ticktum", "cupra", "Reino Unido", 0, 15, 62, 1, 81, 2, 3, "1AgVY2ZfmO9INszM2WNQM6/b57b28546789edba561ddc8784960162/0bdc60a2-9884-45b3-848d-3ffecf12fd59.png", "Venceu em Tóquio. Bicampeão do GP de Macau de F3."],
    [14, "Joel", "Eriksson", "envision", "Suécia", 0, 16, 55, 0, 27, 0, 1, "5LDjDD0JoZ4twnZmchotNd/e80f3a1d020788109d20820c190c5e97/ec44be2a-3898-425d-97ff-4c0857bdfcd9.png", "Ex-piloto de DTM e de testes da Fórmula E."],
    [11, "Lucas", "di Grassi", "lola", "Brasil", 1, 17, 32, 1, 165, 14, 42, "QP4XjmtDo1etn9KcAOHcI/812deabd9cae2b04cf5c5cfbe2f4b379/4a390151-89af-4931-9907-bcbaabb5a152.png", "Campeão de 2016/17 e recordista de pódios da categoria (42). Venceu em Xangai pela Lola."],
    [7, "Maximilian", "Günther", "dspenske", "Alemanha", 0, 18, 23, 0, 116, 7, 12, "7EQ2hXrBWsk3awGUNUmCYE/02b1ab0a824094e5958518fb4349198f/a4aa14e5-3812-425a-a4b6-310b4ad7023c.png", "Sete vitórias na carreira."],
    [23, "Norman", "Nato", "nissan", "França", 0, 19, 20, 0, 80, 1, 3, "2MlELXzRoOtrKWamUEI3xk/6782f0070c3a73fe153b473492575c98/Norman_Nato_Profile.png", "Também corre no WEC, pelo Cadillac #12."],
    [22, "Zane", "Maloney", "lola", "Barbados", 0, 20, 3, 0, 33, 0, 0, "5MuFBGHVuvN7o7CAr2JrdM/d2536a7cdf1902548501c5415995a7fd/d5077259-6631-416e-a374-f4aa2c4b1a82.png", "Primeiro piloto de Barbados na categoria."],
  ];
  const drivers = D.map(([n, first, last, team, country, titles, pos, pts, wins, starts, cw, cp, photo, bio]) => ({
    n, first, last, team, country, titles, pos, pts, wins, bio, img: img(photo),
    extra: [["Largadas na carreira", starts], ["Vitórias na carreira", cw], ["Pódios na carreira", cp]],
  }));

  const R = [
    [1, "São Paulo", "Anhembi", "06 dez", "Dennis", "andretti"], [2, "Cidade do México", "Hermanos Rodríguez", "10 jan", "Cassidy", "citroen"],
    [3, "Miami", "Homestead-Miami", "31 jan", "Evans", "jaguar"], [4, "Jeddah 1", "Corniche", "13 fev", "Wehrlein", "porsche"],
    [5, "Jeddah 2", "Corniche", "14 fev", "Da Costa", "jaguar"], [6, "Madri", "Jarama", "21 mar", "De Vries", "mahindra"],
    [7, "Berlim 1", "Tempelhof", "02 mai", "Müller", "porsche"], [8, "Berlim 2", "Tempelhof", "03 mai", "Evans", "jaguar"],
    [9, "Mônaco 1", "Monte Carlo", "16 mai", "De Vries", "mahindra"], [10, "Mônaco 2", "Monte Carlo", "17 mai", "Rowland", "nissan"],
    [11, "Sanya", "Fenghuang International", "20 jun", "Dennis", "andretti"], [12, "Xangai 1", "Xangai", "04 jul", "Wehrlein", "porsche"],
    [13, "Xangai 2", "Xangai", "05 jul", "Di Grassi", "lola"], [14, "Tóquio 1", "Tokyo Big Sight", "25 jul", "Ticktum", "cupra"],
    [15, "Tóquio 2", "Tokyo Big Sight", "26 jul", "De Vries", "mahindra"], [16, "Londres 1", "ExCeL", "15 ago", "Wehrlein", "porsche"],
    [17, "Londres 2", "ExCeL", "16 ago", "Barnard", "dspenske"],
  ];
  const calendar = R.map(([r, gp, circuit, date, winner, team]) => ({ r, gp, circuit, date, winner, team }));

  SERIES.formulae = {
    id: "formulae", name: "Fórmula E", short: "Fórmula E", season: "2025/26", accent: "#7B61FF", seasonOver: true,
    offSeason: "Temporada encerrada · Gen4 a seguir",
    status: "Wehrlein bicampeão; Jaguar campeã de equipes",
    updated: "Classificação final da temporada 12, após o ePrix de Londres, 16 de agosto de 2026.",
    labels: { season: "Temporada 12", rules: "Gen4" },
    garageLede: "As 10 equipes da última temporada do carro Gen3 Evo. Todas usam o mesmo chassi; o que muda é o powertrain elétrico.",
    peopleLede: "Os 20 pilotos, na ordem final do campeonato.",
    stageMaxW: 1400, card: { w: "112%", top: "10%" },
    hero: {
      kind: "cutout", color: "#5B2BE0", number: "94",
      kicker: "Campeão da temporada 2025/26", first: "Pascal", last: "Wehrlein",
      lede: "O alemão da Porsche venceu três corridas e superou Jake Dennis por 5 pontos. É só o segundo bicampeão da história da Fórmula E, depois de Jean-Éric Vergne.",
      stats: [["Pontos", "169"], ["Vitórias", "3"], ["Vantagem", "+5"]],
      img: img("33JndAFtyYZkujZKhsJjTC/573472bf1ffad48757c07cd1d51a1880/4b62fd44-831d-4b01-9f11-2aaf2c47075c.png"), alt: "Pascal Wehrlein com o macacão da Porsche",
    },
    teams, drivers, calendar,
    ratingLabels: { potencia: "Powertrain", efic: "Eficiência energética", quali: "Classificação", corrida: "Ritmo de corrida", confiab: "Confiabilidade" },
    commonSpecs: [
      ["Chassi", "Spark Gen3 Evo (único)"], ["Potência máxima", "350 kW (≈ 470 cv) no modo ataque"], ["Potência em corrida", "300 kW (≈ 400 cv)"],
      ["Regeneração", "Até 600 kW nas frenagens"], ["0 a 100 km/h", "1,82 s"], ["Velocidade máxima", "≈ 320 km/h"],
      ["Tração", "Traseira; integral no modo ataque e na largada"], ["Pneus", "Hankook, para seco e chuva"], ["Peso mínimo", "≈ 850 kg (com piloto)"],
    ],
    standings: [
      { label: "Pilotos", rows: drivers.map(d => ({ pos: d.pos, name: `${d.first} ${d.last}`, team: d.team, pts: d.pts })) },
      { label: "Equipes", rows: teams.map(t => ({ pos: t.pos, name: t.full, team: t.id, pts: t.pts, sub: `Powertrain ${t.specs[1][1]}` })) },
    ],
    calendarNote: "17 corridas em 11 cidades, de dezembro de 2025 a agosto de 2026. Várias cidades recebem duas corridas no mesmo fim de semana.",
    rules: {
      title: "Gen4: o próximo carro",
      lede: "A temporada 2025/26 foi a última do Gen3. A partir da temporada 13 entra o Gen4, o carro mais potente da história da categoria.",
      compare: {
        head: ["Item", "Gen3 Evo", "Gen4"],
        rows: [
          ["Potência máxima", "350 kW", "600 kW"], ["Regeneração", "600 kW", "700 kW"],
          ["Tração integral", "Só no modo ataque", "Permanente"], ["Pneus", "Hankook", "Bridgestone"],
        ],
      },
      cards: [
        ["Modo ataque", "Ao passar por uma zona fora do traçado ideal, o piloto ganha potência extra e tração integral por alguns minutos."],
        ["Pit Boost", "Em algumas corridas, todos precisam parar para uma recarga rápida de 30 segundos."],
        ["Energia contada", "Cada carro larga com uma quantidade fixa de energia. Quem economizar melhor chega mais forte ao fim."],
      ],
    },
    facts: [
      { big: "1,82 s", text: "Tempo de 0 a 100 km/h do Gen3 Evo, mais rápido que um carro de F1." },
      { big: "16", text: "Vitórias de Mitch Evans, recorde da Fórmula E, ainda sem nenhum título." },
      { big: "42", text: "Pódios de Lucas di Grassi, recorde da categoria. Ele venceu em Xangai em 2026." },
      { big: "Anhembi", text: "A temporada abriu em São Paulo, no Sambódromo. Jake Dennis venceu." },
      { big: "5 pts", text: "Diferença entre Wehrlein e Dennis no fim do campeonato." },
      { big: "2", text: "Brasileiros no grid: Lucas di Grassi (Lola Yamaha ABT) e Felipe Drugovich (Andretti)." },
      { big: "600 kW", text: "Potência de regeneração do Gen3 Evo: boa parte da energia da corrida vem das frenagens." },
    ],
    footer: "Dados de fiaformulae.com. Imagens © Formula E Operations.",
  };
})();
