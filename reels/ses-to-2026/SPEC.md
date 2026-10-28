# SPEC — Reel SES-TO 5.124 vagas

## GOAL

Ao fim, o espectador entende que o concurso da saúde do Tocantins tem 5.124 vagas, que as inscrições já encerraram e que o guia completo está em `concursosagora.com.br`; ele abre o site ou salva o perfil.

## OUTPUT

HyperFrames, 1080×1920, 30 fps, 29,0 s (870 frames), MP4 H.264 + AAC.
Nome de entrega: `reels/ses-to-2026/renders/ses-to-2026-reel.mp4`.

## TIME

29 s corridos. Sem trilha, então não há grade de BPM; os cortes são os tempos fortes.
Cortes: 4,2 / 9,0 / 14,4 / 19,2 / 24,0 s.

| Cena | Entrada | Saída | Frames | Função |
| --- | ---: | ---: | ---: | --- |
| 1. Cinco mil e cento e vinte e quatro | 0,0 | 4,2 | 0–126 | gancho e escala |
| 2. O salário | 4,2 | 9,0 | 126–270 | amplitude |
| 3. As cidades | 9,0 | 14,4 | 270–432 | alcance |
| 4. O carimbo | 14,4 | 19,2 | 432–576 | verdade que segura o clique |
| 5. A prova | 19,2 | 24,0 | 576–720 | produto e fonte |
| 6. O convite | 24,0 | 29,0 | 720–870 | CTA e marca |

## LOOK

- **Fundo:** `#061826` (azul-marinho). Sem glow radial, sem preto lavado.
- **Superfície:** `#0C2A43` para faixas; `#030C14` na faixa inferior (abaixo de 1330 px).
- **Tinta:** `#F7F3E8` (branco-quente). **Secundário:** `#9FB3C6`.
- **Acento:** `#F0C24B` (dourado) em números, fios e barras. **Vermelho:** `#E45745` só no carimbo de inscrições encerradas.
- **Textura:** grade de pontos de 72 px, opacidade 0,06, só no fundo. Nenhum filtro, grão, blur ou vinheta sobre fotografia ou print.
- **Display:** Archivo Black 400. **Texto e dados:** IBM Plex Mono 400/700.
- **Escala:** número-gancho 300 px; manchetes 86–104 px; valores 52–150 px; corpo 30–34 px; legendas 28 px (piso de leitura); kicker 28 px com tracking 0,14 em.
- **Regras:** fios de 1–4 px; cantos retos; sombra dura de 14 px a 14% de dourado, só na foto e no celular; nada de pílulas, chips ou cartões arredondados (exceto o aparelho).
- **Hierarquia:** um número ou uma frase por bloco; o olho nunca tem dois centros.

## LAYOUT

- Área útil: x 84–996; topo 280; base 1330 (a UI do app cobre abaixo disso).
- Topbar persistente em y 190–246: logo 48×48, “CONCURSOS AGORA” 28 px, “SES-TO” 28 px dourado à direita.
- Fios verticais em x 60 e x 1020, de y 190 a 1810; fio horizontal em y 1330.
- Faixa inferior 1330–1920: `#030C14` com código de barras decorativo a 12% de opacidade; nenhuma palavra.
- **Cena 1:** kicker 290; “5.124” 330–590; “VAGAS” 590–700; subtítulo 715; fio 780; foto 820–1180 (912×360, corte 2,53:1, sem filtro); legenda 1192; fonte 1250.
- **Cena 2:** kicker 290; “Até” 345; “R$ 17.727,63” 380–530; fio 610; linha 1 em 660; barra 1 em 736; linha 2 em 840; barra 2 em 916; nota 990.
- **Cena 3:** kicker 290; “9” 330–630; “cidades de prova” 500–610; subtítulo 630–700; grade 3×3 de 720 a 1200; nota 1240.
- **Cena 4:** kicker 290 (vermelho); carimbo 340–740, rotação −2°; taxa 790; homologação 850; status 910; nota 990.
- **Cena 5:** kicker 290; “Leia no site” 330–440; celular 480–1328 (404×848 com bezel); coluna direita x 540–996.
- **Cena 6:** logo 300–420; wordmark 320; tagline 380; “Leia o guia” 480–570; “completo” 570–660; caixa da URL 800–924; “Busque por SES-TO” 960; fonte 1020; sociais 1080–1146; assinatura 1220.

## MOTION

- Entradas de 0,35–0,55 s, `power3.out`; saídas limpas, sem fade universal.
- Número: escala 0,94 → 1 e y 12 → 0 em 0,45 s; “VAGAS” y 20 → 0; fio `scaleX` 0 → 1.
- Salário: valor y 18 → 0; barras `scaleX` 0 → 1 (0,7 s); sem contagem numérica.
- Cidades: cada célula entra em 0,35 s com stagger de 0,11 s; o último pop sonoro acompanha a nona.
- Carimbo: entra de 1,28 e −8° para 1,02 e −2° em 0,18 s (`power4.in`), assenta em 1,0 em 0,08 s. É o único movimento brusco.
- Celular: y 36 → 0 e opacidade 0 → 1 em 0,55 s; o print assenta de 1,04 → 1 em 4,5 s, mantendo a cena viva.
- Fim: logo e URL entram; um fio dourado cresce em 27,2 s. Nada flutua, nada pulsa, nada gira.
- Sem transições dissolvidas: o próximo bloco cobre o anterior no corte.

## SOUND

Sem trilha: o ambiente não tem HeyGen nem modelo local de música. Não improvisar música em código.
Efeitos (Pixabay, licença livre, já no `.media`):

| Tempo | Som | Volume |
| ---: | --- | ---: |
| 0,00 | impact-bass-1 | 0,55 |
| 4,10 | whoosh-short | 0,30 |
| 8,90 | whoosh-short | 0,30 |
| 9,45 + i·0,11 (9×) | pop | 0,12 |
| 14,70 | impact-bass-1 | 0,45 |
| 19,10 | whoosh-short | 0,30 |
| 24,10 | chime | 0,22 |
| 24,72 | key-press | 0,18 |

Sem voz. A peça é feita para o mudo; o texto carrega tudo.

## END CARD

- Marca: logo + “CONCURSOS AGORA”.
- URL em caixa dourada: `concursosagora.com.br`.
- Instrução: “Busque por SES-TO”.
- Fonte: “edital SES-TO / FGV · matéria de 23/10/2026”.
- Sociais: `Instagram @concursosagora_` e `Telegram t.me/concursosagorabr`.
- Assinatura: “CONCURSO SES-TO · 5.124 VAGAS”.
- Permanência: 4,6 s até o fim, com o fio final em 27,2 s.

## CONSTRAINTS

- Não afirmar inscrições abertas. A peça diz “encerradas em 17/09/2026”.
- Não inventar data de prova, resultado ou número: só o que está na matéria.
- Não usar “maior concurso”, “imperdível”, “corra” ou superlativos sem fonte.
- Nenhuma imagem recebe filtro; a foto é ilustrativa e leva crédito.
- Nada de texto abaixo de y 1330; nada de texto na faixa de 168 px do topo.
- Tudo local: GSAP, imagens, logo e SFX. Sem fetch em render.

## ACCEPTANCE

- `npm run check` sem erros; warnings revisados e explicados em `REVIEW.md`.
- Snapshot em 0,0 / 3,5 / 6,0 / 10,0 / 15,2 / 21,0 / 26,0 s sem estouro de caixa, texto cortado ou contraste abaixo de 3:1 em texto grande.
- Primeiro frame legível no mudo: “5.124” e “VAGAS”.
- URL legível nos últimos 4,6 s.
- MP4 1080×1920, 29,0 s, com áudio AAC e sem frame preto no início.
