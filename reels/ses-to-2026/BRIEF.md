# BRIEF — Reel SES-TO 5.124 vagas

---
workflow: general-video
flow: automation
storyboard: no
message: "A saúde do Tocantins tem 5.124 vagas, com vencimentos de até R$ 17.727,63; as inscrições encerraram em 17/09/2026 e o guia completo está no Concursos Agora."
destination: instagram-reels, tiktok, youtube-shorts
aspect: 1080x1920
language: pt-BR
audience: "concurseiros, profissionais de saúde e candidatos a concursos no Tocantins"
length: 29s
angle: "notícia verificada com serviço: o número, a amplitude salarial, as cidades, o prazo encerrado e o guia"
---

## Intent

Um reel jornalístico de serviço para o Concursos Agora. Abre com o número que
prende a atenção, mostra a distância entre o piso e o teto, localiza as provas,
carimba o prazo encerrado para não sugerir inscrição aberta e termina no guia
completo do site. O tom é de redação impressa: preciso, sóbrio e legível no mudo.

## Assets

- `assets/raw/ses-to-hero.jpg` — imagem ilustrativa da matéria, crédito
  `Pexels / Unsplash Curado`, sem filtro.
- `assets/raw/article-mobile.png` — print da matéria no celular, usado como prova
  de produto.
- `assets/raw/logo.png` e `assets/raw/logo-end.png` — marca no topo e no end card.
- `.media/audio/sfx/` — impactos, whoosh, pops, sino e tecla da biblioteca
  Pixabay empacotada com o `media-use`.
- `assets/vendor/gsap.min.js` — GSAP local, sem fetch no render.

## Customizations

- Um pôster de dados que se recompõe no lugar, com cortes secos entre blocos.
- Barras proporcionais de piso e teto, sem contagem numérica.
- Grade 3×3 com as nove cidades do edital.
- Carimbo vermelho de inscrições encerradas com entrada de impacto.
- Print da matéria dentro de um celular, com zoom lento de 4,5 s.
- End card com URL, fonte, data e redes.

## Notes

- A matéria é de 23/10/2026 e o concurso está `EM ANDAMENTO` no site.
- As inscrições encerraram em 17/09/2026; a peça nunca diz que estão abertas.
- O resultado definitivo da homologação das inscrições saiu em 14/10/2026.
- A taxa é cobrada pela banca organizadora, não pelo portal.
- Sem trilha: não há fonte de música instalada. Efeitos pontuais nas ações.
- Formato vertical 1080×1920, 29,0 s, 30 fps, sem narração.
