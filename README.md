# Concursos Agora — Projeto Completo

Monorepo com o frontend público, o Sanity Studio e o agente editorial do Concursos Agora.

## Estrutura

- `concursosagora-main/` — frontend Next.js 15, App Router, Tailwind CSS v4 e integração com Sanity.
- `concursos-sanity-backend/` — schemas, estúdio e scripts do Sanity CMS.
- `agente-artigos/` — pipeline editorial de coleta, verificação, geração e publicação assistida.
- `.github/` — configuração de Dependabot para os projetos Node.

## Repositórios

- Frontend standalone: <https://github.com/concursosagorabr-cell/concursosagora>
- Projeto completo: <https://github.com/concursosagorabr-cell/concursosagoraprojetocompleto>

## Documentação de replicação

O `MANUAL-DE-REPLICACAO-EDITORIAL.md` descreve as skills, ferramentas, repositórios, fontes, travas de qualidade, rotina diária e procedimentos de backup necessários para reproduzir a produção editorial com o mesmo nível de verificação.

## Configuração

Cada subprojeto possui seu próprio `README.md` e `.env.example`. Crie os arquivos `.env.local` localmente a partir dos exemplos; eles não são versionados.

## Segurança

Não versione chaves de API, tokens do Sanity, credenciais de newsletter, bancos locais, backups do dataset ou artefatos de build. O `.gitignore` da raiz cobre esses casos e complementa os `.gitignore` de cada subprojeto.
