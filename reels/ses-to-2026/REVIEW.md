# REVISÃO — Reel SES-TO 5.124 vagas

## Check automatizado

`npm run check` (HyperFrames 0.8.186), em 25/10/2026:

| Bloco | Resultado |
| --- | --- |
| Lint | 0 erros, 7 avisos estruturais |
| Runtime | 0 erros, 0 avisos |
| Layout | 0 problemas em 9 amostras |
| Motion | 0 erros, 0 avisos |
| Contraste | 45/45 textos passam WCAG AA |
| Craft | 0 erros, 0 avisos |

Relatório copiado para `renders/review/check-report.json` (original em
`.hyperframes/artifacts/checks/682af583-d0bc-4d42-9e8d-9410bec7e2d8.json`).

## Avisos e decisão

Os 7 avisos são todos do mesmo tipo: o arquivo único tem 535 linhas e as seis
cenas são `<section>` com `<div>` dentro. O HyperFrames prefere uma
subcomposição por cena em `compositions/` para edição no Studio.

**Decisão:** manter o arquivo único nesta entrega. O reel tem uma timeline só,
com tempos absolutos auditáveis (0 / 4,2 / 9,0 / 14,4 / 19,2 / 24,0 / 29,0 s).
Dividir em seis arquivos acrescentaria seis timelines e seis pontos de
dessincronização para resolver um aviso de legibilidade, não um defeito de
render. O vídeo não precisa ser editado no Studio por outra pessoa.

## Fatos na tela e origem

| Na tela | Origem |
| --- | --- |
| 5.124 vagas | matéria SES-TO, 23/10/2026 |
| nível médio e superior | matéria |
| R$ 1.735,55 a R$ 17.727,63 | matéria |
| assistente de serviços de saúde | matéria |
| médico com registro de qualificação de especialista | matéria |
| etapa única, prova objetiva de conhecimentos gerais e específicos, eliminatória e classificatória | matéria |
| nove cidades e os nove nomes | matéria |
| inscrições encerradas em 17/09/2026 | matéria |
| taxa R$ 100 (médio) e R$ 150 (superior) | matéria |
| homologação das inscrições em 14/10/2026 | matéria |
| EM ANDAMENTO | status do concurso no site |
| fonte edital SES-TO / FGV | matéria |
| imagem ilustrativa Pexels / Unsplash Curado | crédito da imagem da matéria |

Não há data de prova, resultado final, número de aprovados nem promessa de
inscrição aberta na peça.

## Imagens e áudio

- Nenhum filtro, grão, blur ou vinheta sobre foto ou print. A foto é ilustrativa
  e leva crédito na tela.
- O print é a própria matéria no celular, sem retoque.
- Não há trilha: o ambiente não tem HeyGen nem modelo local de música. Os únicos
  sons são efeitos Pixabay nas ações visíveis. Para adicionar música, use uma
  faixa instrumental de 100–120 BPM, ducking de −18 dB sob os SFX e fade final
  de 1,5 s; o arquivo não foi mixado com trilha.
- Sem narração; a peça foi desenhada para o mudo.

## Snapshots

`npx hyperframes snapshot --review` gerou 38 quadros e 7 folhas de contato. As
folhas estão copiadas em `renders/review/`; os quadros completos ficam em
`.hyperframes/artifacts/snapshots/129c9ad5-a263-4969-b112-368e9bf1d925/`
(gerado, ignorado pelo git).

Folhas principais:

- `review-beats.jpg` — 13 beats: 0,3 / 2,1 / 4,5 / 6,6 / 9,3 / 11,7 / 14,5 /
  14,7 / 16,8 / 19,5 / 21,6 / 24,3 / 26,5 s.
- `review-seam-01.jpg` a `review-seam-05.jpg` — os cinco cortes; o mais
  delicado é o 4 (19,0–19,4 s), com o celular entrando.
- `review-phone.jpg` — o print dentro do aparelho.

**Limitação de revisão:** o modelo desta sessão não recebe imagens. A revisão
visual acima é automatizada (layout, contraste, motion, runtime) e geométrica;
as folhas de contato estão prontas para o editor humano confirmar enquadramento,
recortes da foto e legibilidade no celular.

## Pontos para o editor humano

1. A foto é ilustrativa; confirmar se o recorte 2,53:1 não corta o assunto de
   forma estranha em `beat-02-at-2.1s.png`.
2. O nome “Médico com registro de qualificação de especialista” ocupa duas
   linhas; conferir se a barra dourada não encosta na segunda linha em
   `beat-04-at-6.6s.png`.
3. O carimbo entra em 14,55 s; conferir se a rotação de −2° não encosta no fio
   direito em `beat-09-at-16.8s.png`.
4. O print do celular começa com zoom de 1,04 e assenta em 1,0; conferir o corte
   da borda em `review-phone.jpg`.
5. O end card fica 4,6 s na tela; conferir a URL em `beat-13-at-26.5s.png`.

## Aprovação

- Check: **passou**.
- Fatos: **conferidos contra a matéria e o edital**.
- Publicação: **não publicar antes da revisão humana das folhas de contato**.
