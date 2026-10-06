# Pitstop

Carros, pilotos, fichas técnicas, galerias e a temporada 2026 de Fórmula 1, Fórmula E, MotoGP e WEC em um só lugar.

Site estático (HTML, CSS e JavaScript, sem build). Para rodar localmente:

```bash
python -m http.server 5173
```

## Dados

Cada campeonato tem um arquivo em `data/` (`f1.js`, `formulae.js`, `motogp.js`, `wec.js`). As galerias dos veículos ficam em `data/media.js`. Os dados não se atualizam sozinhos: edite esses arquivos depois de cada corrida.

## Créditos

Projeto de fã, sem vínculo com os campeonatos.

- Dados: formula1.com, fiaformulae.com, API oficial da MotoGP, fiawec.com.
- Imagens oficiais: Formula One World Championship Limited, Formula E Operations, Dorna Sports, FIA WEC / ACO.
- Fotos da Wikimedia Commons: autor e licença indicados em cada foto da galeria.
- Vídeos: canais oficiais no YouTube, incorporados pelo player do YouTube.
