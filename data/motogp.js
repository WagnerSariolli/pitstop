// MotoGP 2026 — fonte: API oficial da MotoGP (motogp.com), após a etapa 16 (GP do Japão, Motegi, 4 out 2026)
(() => {
  // fotos oficiais (photos.motogp.com) convertidas para WebP em img/motogp: os originais têm até 4 MB cada
  const rider = path => `img/motogp/${path.split("/")[2].slice(0, 8)}.webp`;

  // [id, nome, nome completo, moto, cor, motor, fabricante, sede, pos, pts, ratings, nota]
  const T = [
    ["aprilia", "Aprilia Racing", "Aprilia Racing", "RS-GP26", "#C81E4B", "V4 a 90°", "Aprilia", "Noale, Itália", 1, 617, [95, 94, 93, 92, 92],
      "A melhor moto de 2026. Bezzecchi abriu o ano com três vitórias seguidas e Martín lidera o campeonato na base da regularidade."],
    ["ducati", "Ducati Lenovo", "Ducati Lenovo Team", "Desmosedici GP26", "#E2001A", "V4 a 90° (Desmodrômico)", "Ducati", "Borgo Panigale, Itália", 2, 495, [94, 93, 94, 94, 90],
      "Marc Márquez venceu 6 das 16 corridas e está a 2 pontos da liderança. O comando de válvulas desmodrômico é marca registrada da Ducati."],
    ["trackhouse", "Trackhouse", "SuperFile Trackhouse MotoGP Team", "RS-GP26", "#9AD400", "V4 a 90°", "Aprilia", "Concord, EUA", 3, 453, [93, 92, 91, 90, 89],
      "Equipe americana ligada à NASCAR, com motos Aprilia de fábrica. Ogura venceu em Assen e Raúl Fernández em Silverstone."],
    ["ktm", "KTM", "Red Bull KTM Factory Racing", "RC16", "#FF6A13", "V4 a 86°", "KTM", "Mattighofen, Áustria", 4, 342, [91, 88, 88, 87, 85],
      "Única fábrica com chassi tubular de aço. Pedro Acosta venceu em casa da marca, na Áustria."],
    ["gresini", "Gresini", "BK8 Gresini Racing MotoGP", "Desmosedici GP25", "#8FB8EE", "V4 a 90° (Desmodrômico)", "Ducati", "Faenza, Itália", 5, 289, [89, 89, 90, 90, 84],
      "Corre com a moto Ducati do ano anterior. Álex Márquez venceu em Jerez."],
    ["vr46", "VR46", "Pertamina Enduro VR46 Racing Team", "Desmosedici GP26", "#E6F200", "V4 a 90° (Desmodrômico)", "Ducati", "Tavullia, Itália", 6, 287, [92, 91, 92, 92, 86],
      "A equipe de Valentino Rossi. Di Giannantonio venceu na Catalunha com a moto de fábrica."],
    ["hrc", "Honda HRC", "Honda HRC Castrol", "RC213V", "#2C5BD8", "V4", "Honda", "Tóquio, Japão", 7, 143, [86, 85, 84, 83, 82],
      "A maior vencedora da história da categoria segue em reconstrução depois dos anos difíceis."],
    ["tech3", "Tech3", "Red Bull KTM Tech3", "RC16", "#00A3E0", "V4 a 86°", "KTM", "Bormes-les-Mimosas, França", 8, 133, [88, 85, 85, 85, 80],
      "Equipe satélite da KTM com Bastianini e Viñales, dois vencedores de GP."],
    ["lcr", "LCR Honda", "Pro Honda LCR / Castrol Honda LCR", "RC213V", "#00A050", "V4", "Honda", "Mônaco", 9, 122, [85, 84, 83, 82, 82],
      "Casa do brasileiro Diogo Moreira, campeão da Moto2 em 2025, ao lado do veterano Johann Zarco."],
    ["yamaha", "Yamaha", "Monster Energy Yamaha MotoGP Team", "YZR-M1", "#3050D0", "V4 (estreia em 2026)", "Yamaha", "Iwata, Japão", 10, 90, [84, 83, 84, 82, 80],
      "Abandonou o tradicional motor de 4 cilindros em linha e estreou um V4 em 2026, ainda em desenvolvimento."],
    ["pramac", "Pramac", "Prima Pramac Yamaha MotoGP", "YZR-M1", "#7B3FE4", "V4 (estreia em 2026)", "Yamaha", "Itália", 11, 46, [83, 82, 83, 81, 78],
      "Tem o tricampeão de Superbike Toprak Razgatlıoğlu, estreante na MotoGP."],
  ];
  // fotos oficiais (resources.motogp.pulselive.com): todas têm a frente; só as KTM têm uma vista de três quartos
  const views = id => [{ id: "front", label: "Frente", img: `img/motogp/front-${id}.webp` },
    ...(["ktm", "tech3"].includes(id) ? [{ id: "34", label: "Três quartos", img: `img/motogp/side-${id}.webp` }] : [])];
  const teams = T.map(([id, name, full, car, color, engine, maker, base, pos, pts, r, note]) => ({
    id, name, full, car, color, pos, pts, note, ghost: maker, views: views(id),
    ptsLabel: `${pts} pts somados pelos pilotos`,
    ratings: { motor: r[0], aero: r[1], ciclistica: r[2], eletronica: r[3], consist: r[4] },
    specs: [["Moto", car], ["Fabricante", maker], ["Motor", engine], ["Sede", base]],
  }));

  // [nº, nome, sobrenome, equipe, país, nascimento, cidade, títulos, pos, pts, vitórias, pódios, foto, bio]
  const D = [
    [89, "Jorge", "Martín", "aprilia", "Espanha", "29/01/1998", "Madri", 2, 1, 333, 1, 8, "5/b/5b9af34e-da94-4ca2-9c4c-6be0fc8b1bbc/2026/profile/main-560307", "Campeão de 2024. Lidera 2026 com só uma vitória em GP, mas 8 pódios e 4 vitórias em sprints."],
    [93, "Marc", "Márquez", "ducati", "Espanha", "17/02/1993", "Cervera", 9, 2, 331, 6, 6, "2/3/23e50438-a657-4fb0-a190-3262b5472f29/2026/profile/main-129758", "Nove títulos mundiais. Venceu 6 corridas em 2026, mais que qualquer outro piloto."],
    [72, "Marco", "Bezzecchi", "aprilia", "Itália", "12/11/1998", "Rimini", 0, 3, 284, 4, 10, "e/6/e622ec5b-5ccf-457c-a67f-ec028f0ddf6e/2026/profile/main-590216", "Venceu as três primeiras corridas do ano, inclusive em Goiânia. Lidera em número de pódios."],
    [37, "Pedro", "Acosta", "ktm", "Espanha", "25/05/2004", "Múrcia", 2, 4, 243, 1, 6, "e/a/ea39a0af-95d3-4a37-81a7-f332efdb9216/2026/profile/main-274705", "O 'Tubarão de Mazarrón'. Campeão de Moto3 e Moto2, venceu na Áustria."],
    [79, "Ai", "Ogura", "trackhouse", "Japão", "26/01/2001", "Kiyose", 1, 5, 237, 1, 4, "2/4/244b6f51-ac33-40ee-876d-9401dc9d1346/2026/profile/main-768086", "Campeão da Moto2 em 2024. Primeira vitória na MotoGP em Assen."],
    [49, "Fabio", "Di Giannantonio", "vr46", "Itália", "10/10/1998", "Roma", 0, 6, 230, 1, 3, "5/2/525b1551-f10b-4cfd-9b43-59af6fca654b/2026/profile/main-954753", "'Diggia' venceu na Catalunha com a Ducati de fábrica da VR46."],
    [25, "Raúl", "Fernández", "trackhouse", "Espanha", "23/10/2000", "Madri", 0, 7, 216, 1, 4, "e/e/eec1f7dc-b115-44f6-82aa-73130e5c92cf/2026/profile/main-645555", "Venceu em Silverstone. Uma das grandes evoluções da temporada."],
    [63, "Francesco", "Bagnaia", "ducati", "Itália", "14/01/1997", "Turim", 3, 8, 164, 0, 4, "6/6/66b78301-5826-4986-b11e-fa68a7bd77a7/2026/profile/main-794330", "'Pecco' é bicampeão da MotoGP (2022 e 2023). Ainda busca a primeira vitória do ano."],
    [73, "Álex", "Márquez", "gresini", "Espanha", "23/04/1996", "Cervera", 2, 9, 158, 1, 2, "4/1/41195f0f-9817-4a4d-913e-c1fbbb351d9b/2026/profile/main-629834", "Irmão de Marc, vice-campeão em 2025. Venceu em Jerez."],
    [54, "Fermín", "Aldeguer", "gresini", "Espanha", "05/04/2005", "El Palmar", 0, 10, 122, 0, 1, "7/1/71052114-5bce-4307-908c-4cc2bd387aac/2025/profile/main-821748", "Segunda temporada na categoria, já com pódio."],
    [23, "Enea", "Bastianini", "tech3", "Itália", "30/12/1997", "Rimini", 1, 11, 116, 0, 0, "0/0/00db2312-15f2-4333-be5c-4bbff9d17aec/2026/profile/main-868954", "Campeão da Moto2 em 2020 e vencedor de GPs pela Ducati."],
    [10, "Luca", "Marini", "hrc", "Itália", "10/08/1997", "Urbino", 0, 12, 104, 0, 0, "5/d/5dfc20db-c3c4-4ecd-9c7c-f6cfd042031a/2026/profile/main-6493", "Meio-irmão de Valentino Rossi. Peça-chave no desenvolvimento da Honda."],
    [33, "Brad", "Binder", "ktm", "África do Sul", "11/08/1995", "Potchefstroom", 1, 13, 99, 0, 0, "a/d/ade5ef32-01ea-487c-95ca-491544a668ed/2026/profile/main-118981", "Campeão da Moto3 em 2016. Dono do recorde de velocidade da MotoGP: 366,1 km/h."],
    [11, "Diogo", "Moreira", "lcr", "Brasil", "23/04/2004", "São Paulo", 1, 14, 74, 0, 0, "e/2/e2479f8e-dad8-4191-9a6c-9d4aafa8c3a3/2026/profile/main-452060", "Campeão da Moto2 em 2025. Primeiro brasileiro na MotoGP desde Alex Barros, em 2007."],
    [20, "Fabio", "Quartararo", "yamaha", "França", "20/04/1999", "Nice", 1, 15, 66, 0, 0, "b/f/bf95d959-6a60-44f1-84b5-ded861e62578/2026/profile/main-774105", "Campeão de 2021. Lidera o desenvolvimento da nova Yamaha V4."],
    [21, "Franco", "Morbidelli", "vr46", "Itália", "04/12/1994", "Roma", 1, 16, 57, 0, 0, "4/1/4113c5f7-33c5-4246-b05b-3f81f4ddbd8f/2026/profile/main-87405", "Campeão da Moto2 em 2017 e vice da MotoGP em 2020. Nascido em Roma, filho de mãe brasileira."],
    [5, "Johann", "Zarco", "lcr", "França", "16/07/1990", "Cannes", 2, 17, 48, 0, 0, "4/a/4a439bde-305a-4995-b3e7-783fa99f784a/2026/profile/main-662501", "Bicampeão da Moto2. Venceu em Le Mans em 2025 com a Honda."],
    [36, "Joan", "Mir", "hrc", "Espanha", "01/09/1997", "Palma de Mallorca", 2, 18, 33, 0, 0, "f/5/f55f9c34-8621-437b-ae04-ae2418720204/2026/profile/main-968150", "Campeão da MotoGP em 2020 pela Suzuki."],
    [43, "Jack", "Miller", "pramac", "Austrália", "18/01/1995", "Townsville", 0, 19, 28, 0, 0, "b/0/b0c1fea6-2dd5-4e26-8a18-0ac9fe6870e4/2026/profile/main-477996", "Vencedor de GPs por Honda e Ducati, conhecido pelo estilo agressivo."],
    [42, "Álex", "Rins", "yamaha", "Espanha", "08/12/1995", "Barcelona", 0, 20, 24, 0, 0, "0/4/04bf0ce4-5062-44fc-9745-ec85a8d8f8d3/2026/profile/main-442683", "Seis vitórias na carreira, por Suzuki e Honda."],
    [7, "Toprak", "Razgatlıoğlu", "pramac", "Turquia", "16/10/1996", "Alanya", 3, 21, 18, 0, 0, "c/8/c883a3b8-17ce-419d-b71b-32c252f6fc7e/2026/profile/main-933222", "Tricampeão mundial de Superbike, famoso pelas frenagens com a roda traseira no ar. Estreante em 2026."],
    [12, "Maverick", "Viñales", "tech3", "Espanha", "12/01/1995", "Figueres", 1, 22, 12, 0, 0, "7/1/71df6f0d-51c3-4cdb-9f5c-51939e6f33f2/2026/profile/main-652890", "Campeão da Moto3 em 2013 e vencedor de GPs por três fabricantes diferentes."],
  ];
  const drivers = D.map(([n, first, last, team, country, born, place, titles, pos, pts, wins, podiums, img, bio]) => ({
    n, first, last, team, country, born, place, titles, pos, pts, wins, bio,
    img: rider(img), extra: [["Pódios em 2026", podiums]],
  }));

  const C = [
    [1, "Tailândia", "Buriram", "01 mar", "Bezzecchi", "aprilia"], [2, "Brasil", "Goiânia", "22 mar", "Bezzecchi", "aprilia"],
    [3, "Estados Unidos", "Circuito das Américas", "29 mar", "Bezzecchi", "aprilia"], [4, "Espanha", "Jerez", "26 abr", "Á. Márquez", "gresini"],
    [5, "França", "Le Mans", "10 mai", "Martín", "aprilia"], [6, "Catalunha", "Barcelona-Catalunya", "17 mai", "Di Giannantonio", "vr46"],
    [7, "Itália", "Mugello", "31 mai", "Bezzecchi", "aprilia"], [8, "Hungria", "Balaton Park", "07 jun", "M. Márquez", "ducati"],
    [9, "República Tcheca", "Brno", "21 jun", "M. Márquez", "ducati"], [10, "Holanda", "Assen", "28 jun", "Ogura", "trackhouse"],
    [11, "Alemanha", "Sachsenring", "12 jul", "M. Márquez", "ducati"], [12, "Grã-Bretanha", "Silverstone", "09 ago", "R. Fernández", "trackhouse"],
    [13, "Aragão", "MotorLand Aragón", "30 ago", "M. Márquez", "ducati"], [14, "San Marino", "Misano", "13 set", "M. Márquez", "ducati"],
    [15, "Áustria", "Red Bull Ring", "20 set", "Acosta", "ktm"], [16, "Japão", "Motegi", "04 out", "M. Márquez", "ducati"],
    [17, "Indonésia", "Mandalika", "11 out"], [18, "Austrália", "Phillip Island", "25 out"], [19, "Malásia", "Sepang", "01 nov"],
    [20, "Catar", "Lusail", "08 nov"], [21, "Portugal", "Portimão", "22 nov"], [22, "Valência", "Ricardo Tormo", "29 nov"],
  ];
  const calendar = C.map(([r, gp, circuit, date, winner, team]) => ({ r, gp, circuit, date, winner, team }));
  Object.assign(calendar[16], { start: "2026-10-11T07:00:00Z", pill: "GP da Indonésia" });

  SERIES.motogp = {
    id: "motogp", name: "MotoGP", short: "MotoGP", season: "2026", accent: "#FF2E3F",
    status: "Martín lidera por 2 pts sobre Marc Márquez",
    updated: "Atualizado após a etapa 16, GP do Japão (Motegi), 4 de outubro de 2026.",
    labels: { garage: "Box", people: "Pilotos", vehicle: "moto", cta: "Entrar no box", rules: "Regras" },
    garageLede: "As 11 equipes e suas motos de 2026. Escolha uma para ver a máquina de frente, a ficha técnica e o desempenho.",
    peopleLede: "Os 22 titulares, na ordem do campeonato. Toque em um piloto para ver o perfil.",
    debutLabel: "Estreia",
    card: { w: "88%", top: "6%" },
    hero: {
      kind: "cutout", color: "#C81E4B", number: "89",
      kicker: "Líder do campeonato · após 16 de 22 etapas", first: "Jorge", last: "Martín",
      lede: "Campeão de 2024, o espanhol da Aprilia lidera por apenas 2 pontos sobre Marc Márquez. Venceu só uma corrida, mas soma 8 pódios e 4 vitórias em sprints.",
      stats: [["Pontos", "333"], ["Pódios", "8"], ["Vantagem", "+2"]],
      img: rider("5/b/5b9af34e-da94-4ca2-9c4c-6be0fc8b1bbc/2026/profile/main-560307"), alt: "Jorge Martín com o macacão da Aprilia",
    },
    teams, drivers, calendar,
    ratingLabels: { motor: "Motor", aero: "Aerodinâmica", ciclistica: "Ciclística", eletronica: "Eletrônica", consist: "Consistência" },
    commonSpecs: [
      ["Cilindrada", "1.000 cm³ (último ano)"], ["Cilindros", "Até 4, quatro tempos"], ["Potência", "≈ 300 cv"],
      ["Peso mínimo", "157 kg (moto)"], ["Câmbio", "6 marchas, seamless"], ["Combustível", "22 litros por corrida"],
      ["Freios", "Disco de carbono Brembo"], ["Pneus", "Michelin (último ano)"], ["Eletrônica", "Central única Magneti Marelli"],
      ["Velocidade máxima", "366,1 km/h (recorde)"],
    ],
    standings: [
      { label: "Pilotos", rows: drivers.map(d => ({ pos: d.pos, name: `${d.first} ${d.last}`, team: d.team, pts: d.pts })) },
      { label: "Equipes", note: "Soma dos pontos dos pilotos de cada equipe.", rows: teams.map(t => ({ pos: t.pos, name: t.name, team: t.id, pts: t.pts, sub: `${t.ghost} ${t.car}` })) },
    ],
    calendarNote: "22 etapas, cada uma com uma corrida sprint no sábado e a corrida principal no domingo.",
    rules: {
      title: "O que muda em 2027",
      lede: "2026 é o último ano da geração atual. Em 2027 as motos ficam menores, mais lentas e mais simples.",
      compare: {
        head: ["Item", "2026", "2027"],
        rows: [
          ["Cilindrada", "1.000 cm³", "850 cm³"], ["Diâmetro do cilindro", "81 mm", "75 mm"],
          ["Controle de altura (holeshot)", "Permitido", "Proibido"], ["Pneus", "Michelin", "Pirelli"],
          ["Combustível", "22 L", "20 L"], ["Peso mínimo", "157 kg", "153 kg"],
        ],
      },
      cards: [
        ["Corridas sprint", "Desde 2023, todo sábado tem uma corrida com metade da distância, valendo metade dos pontos."],
        ["Concessões", "Fabricantes com resultados ruins ganham mais testes e mais motores. É o caso da Honda e da Yamaha."],
        ["Asas", "As motos usam asas e carenagens aerodinâmicas para manter a roda dianteira no chão nas acelerações."],
      ],
    },
    facts: [
      { big: "2 pts", text: "Diferença entre Martín e Marc Márquez a seis etapas do fim." },
      { big: "366,1", text: "km/h: recorde de velocidade da MotoGP, de Brad Binder em Mugello, 2023." },
      { big: "64°", text: "Inclinação que as motos alcançam nas curvas. O cotovelo encosta no asfalto." },
      { big: "Goiânia", text: "O Brasil voltou ao calendário em 2026, pela primeira vez desde 2004. Bezzecchi venceu." },
      { big: "2007", text: "Último ano com um brasileiro na MotoGP antes de Diogo Moreira: Alex Barros." },
      { big: "9", text: "Títulos mundiais de Marc Márquez, somando todas as categorias." },
      { big: "3", text: "Vitórias seguidas de Bezzecchi na abertura de 2026: Tailândia, Brasil e Estados Unidos." },
      { big: "1,6 G", text: "Desaceleração aproximada nas frenagens mais fortes." },
    ],
    footer: "Dados da API oficial da MotoGP. Imagens © Dorna Sports.",
  };
})();
