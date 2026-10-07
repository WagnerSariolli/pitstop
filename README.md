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

## Dados sempre atualizados

O workflow `.github/workflows/update-data.yml` roda de hora em hora no GitHub Actions e executa
`scripts/update-data.mjs`, que busca classificação, vencedores e horários de largada e grava `data/live.js`.
O site aplica esse arquivo por cima dos dados fixos de `data/<campeonato>.js`. O commit só acontece quando algum número muda.

- F1: API Jolpica-F1 (api.jolpi.ca)
- MotoGP: API de resultados do site oficial (api.motogp.pulselive.com)
- WEC: tabelas da página da temporada na Wikipedia (o WEC não tem API pública)
- Fórmula E: temporada encerrada; a próxima precisa de dados novos (equipes, carros, calendário)

Para rodar na mão: `node scripts/update-data.mjs`. Também dá para disparar pela aba Actions ("Run workflow").

## Boletim por e-mail

Visitantes se inscrevem pelo formulário do site (página inicial e rodapé). Os e-mails são enviados pelo
[Buttondown](https://buttondown.com), que guarda a lista, pede a confirmação da inscrição e cuida do descadastro.

- `scripts/newsletter.mjs` roda no mesmo workflow de hora em hora. Manda um e-mail quando aparece um vencedor novo
  e, às quintas-feiras, a agenda do fim de semana. O que já foi avisado fica em `data/newsletter-state.json`.
- Configuração: nome de usuário do Buttondown em `data/newsletter.js` e a chave da API no segredo
  `BUTTONDOWN_API_KEY` do repositório (Settings → Secrets and variables → Actions). Sem a chave, nada é enviado.

## Destaques das corridas

`scripts/highlights.mjs` (no mesmo workflow de hora em hora) junta os vídeos oficiais de cada etapa
pelos feeds RSS dos canais da F1, Fórmula E, MotoGP e FIA WEC no YouTube, e fotos com licença livre das
categorias da temporada na Wikimedia Commons. Grava `data/highlights.js`, que alimenta a seção "Destaques"
de cada campeonato, os "Momentos épicos" da página inicial e o link de vídeo no boletim.
O canal da F1 bloqueia a exibição fora do YouTube, então os vídeos dele abrem lá.
