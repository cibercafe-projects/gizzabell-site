# Implementation Plan: Site da Artista Independente — Gizza Bell

**Branch**: `001-artist-site` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-artist-site/spec.md`

## Summary

Site público (Home, Timeline, Agenda, Discografia, Post, Contato) + backoffice de uma
artista, em Astro 7 com SSR em processo Node único, hospedado em VPS própria.

A home mostra **todos** os posts em dois modos alternáveis: **feed** (lista vertical
estilo Instagram, com slider de carrossel) e **mosaico** (grade com o tamanho de cada
tile proporcional à popularidade). Três ordenações: data, pasta e popularidade. A
timeline lista os posts de categoria `show`, `lancamento`, `evento` e `trabalhos`. A
agenda e o backoffice são gerenciados pela própria artista, com login e senha exclusivos.

Abordagem técnica: **SSR com leitura do acervo por requisição**, porque o backoffice
grava arquivo e versiona em commit (FR-129) e a alteração precisa valer em até 5
segundos sem republicação manual (FR-130). Todo acesso a dados passa por interfaces de
repositório (FR-127) cuja implementação hoje é em arquivo — a porta para um banco
(`node:sqlite`) fica aberta sem custo (FR-128, FR-132, R14).

O acervo é **arquivo, não banco**: `content/` (posts, índice de pastas, discografia,
agenda, privados), `files/` (mídia) e `data/` (estado de runtime, fora do git). Zero
JavaScript de framework no cliente; zero dependência nativa no runtime; orçamento de
150 KB na primeira visualização e 30 KB de JS gzip, verificados a cada build.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js 24 LTS (ESM, `.nvmrc`)

**Primary Dependencies**:
- Runtime: `astro` 7.4.5, `@astrojs/node` 11.1.9, `yaml` 2.9.1, `marked` 18.1.3
- Desenvolvimento: `typescript`, `@astrojs/check` 0.9.12, `vitest` 5.1.0, `eslint` 9,
  `eslint-plugin-astro`, `prettier`, `prettier-plugin-astro`, `sharp` 0.35.5
  (apenas no script de preparo de assets, nunca em runtime)

**Storage**: Arquivos — `content/` (editorial, versionado), `files/` (mídia,
versionado), `data/` (estado de runtime: contadores, sessões, auditoria; fora do git).
Futuro: `node:sqlite` (nativo do Node, sem dependência) via `npm run migrate:db`.

**Testing**: Vitest 5.1.0 + API programática do Astro (`dev()` / `preview()`) para
exercitar rotas HTTP reais via `fetch`. Sem Playwright.

**Target Platform**: VPS Linux (systemd) com Node 24 e reverse proxy (Caddy) para TLS.
Navegadores modernos (últimas 2 versões de Chrome, Safari, Firefox, Edge).

**Project Type**: web-service SSR + entrega de arquivos estáticos (uma aplicação,
um processo)

**Performance Goals**:
- LCP < 2,5 s em 4G simulada; CLS < 0,1 (SC-001, SC-002)
- ≤ 150 KB comprimidos na primeira visualização; ≤ 30 KB de JS gzip (SC-003)
- Resposta do servidor da home < 200 ms com cache quente
- Busca responde < 500 ms (SC-005)
- Publicação pelo backoffice aparece no acervo em ≤ 5 s (SC-017)

**Constraints**:
- Processo único Node; sem microsserviço, fila, cache distribuído ou container
- Sem framework JS no cliente; sem SDK de streaming; sem serviço de terceiros no
  caminho crítico de renderização
- Sem dependência nativa no runtime
- `files/` servido a partir da raiz do repositório, com Range request (vídeo)
- Acervo em arquivo até o gatilho de volume (FR-134)

**Scale/Scope**: 6 páginas públicas, 6 telas de backoffice, ~100–500 posts,
~10–30 lançamentos, ~50–200 faixas, ~1 arquivo de mês por post publicado.

## Constitution Check

*GATE: passou na versão v2.3.1. Revalidado após o design (Phase 1).*

| Princípio / regra | Exigência | Como o plano cumpre | Evidência |
|---|---|---|---|
| I. Leveza (não-negoociável) | ≤150 KB 1ª visualização; ≤30 KB JS gzip; zero JS de framework | Astro SSR sem islands de framework; JS do cliente só para busca, player, alternância e carrossel (~3–5 KB por módulo) | `scripts/check-budget.mjs` falha o build acima do orçamento (R12) |
| I. Leveza | Imagens em formato moderno com dimensões | Leitor de cabeçalho WebP/JPEG/PNG → `width`/`height` no HTML; WebP gerado pelo script de preparo | `src/lib/media/image-size.ts`; `npm run assets:prepare` |
| I. Leveza | Fontes locais ou system stack | System stack (sem webfont) | `src/styles/tokens.css` |
| II. Simplicidade Operacional | Uma única aplicação Node | Um processo Astro/Node; sem serviço adicional | `astro.config.mjs` com `@astrojs/node` standalone |
| II. Simplicidade | Sem banco relacional agora | Acervo e estado em arquivo; `node:sqlite` só no futuro | `src/lib/content/` + `scripts/migrate-to-db.mjs` |
| II. Simplicidade | Autenticação só da artista, sem cadastro público | Uma conta, sessão opaca, rate limit | `src/lib/auth/` (R7) |
| II. Simplicidade | Backoffice é a única exceção de estado mutável | Agenda, privados, releases e contadores em arquivo | `src/lib/content/` (R2) |
| II. Simplicidade | Sem serviço de terceiros no caminho crítico | Busca e player locais; embeds sob demanda | FR-088 (só e-mail/redes) |
| III. Estética Cyberpunk | Tokens centralizados, sem literal em componente | `src/styles/tokens.css` como fonte única de cor/tipografia/espaço/raio/sombra/brilho | `src/styles/global.css` consome só `var(--*)` |
| III. Estética | Tema claro e escuro | Tokens em dois conjuntos + `prefers-color-scheme` + toggle com script inline anti-FOUC | `src/components/ThemeToggle.astro` |
| III. Estética | Hierarquia topo/mosaico/player estável | Layout único (`BaseLayout.astro`) com as três faixas em todas as páginas | `src/layouts/BaseLayout.astro` |
| III. Estética | Mosaico estável, sem salto de layout | Ordem e tamanhos resolvidos no servidor; escalas discretas por posição no ranking | `src/lib/content/popularity.ts` (R6, R1) |
| III. Estética | Acessibilidade: teclado, foco visível, alvo ≥44px | Controles com `aria-*`, foco visível, CSS com alvo mínimo | `src/styles/global.css`; `npm run test` cobre navegabilidade |
| IV. Conteúdo é Dado | Posts com pasta própria, sem limite de mídias | `midias` é lista livre; pasta derivada do campo `pasta` | `contracts/content-format.md` |
| IV. Conteúdo é Dado | Categoria fechada decide a timeline | Enum de 5 valores validado no load | `src/lib/content/schema.ts` |
| IV. Conteúdo é Dado | Descrições por ano/mês + índice de pastas | `content/<ano>/<mes>.md` e `content/index.md` | `contracts/content-format.md` |
| IV. Conteúdo é Dado | Publicar sem mexer em código | Adicionar mídia + entrada no arquivo do mês | `npm run validate:content` |
| V. Spec + Evidência | Fluxo constitution→spec→plan→tasks→implement→converge | Seguindo; tasks em `/speckit.tasks` | `specs/001-artist-site/` |
| V. Spec + Evidência | Testes para API, dados, ordenação e performance | Suíte Vitest: repositórios, ordenação, rotas, guardas de sessão, budget | `tests/` |
| V. Spec + Evidência | 4 quality gates antes de merge | `lint`, `typecheck`, `test`, `build` | `package.json` scripts |
| VI. Arquivo é fonte da verdade | Acessos só via repositório | Interfaces em `src/lib/content/repository.ts` | FR-127 |
| VI. Arquivo é fonte da verdade | Trocar arquivo→banco não toca páginas | Implementação por trás da interface; `migrate:db` | FR-128, FR-132 (R14) |
| VI. Arquivo é fonte da verdade | Publicação = arquivo + commit | `src/lib/git/commit.ts` | FR-129 (R8) |
| 2. Deploy | `files/` servido com cache longo e imutável | Middleware com `immutable` + ETag + Range | `src/middleware.ts` (R5) |
| 2. Performance | Page weight verificado em CI | `scripts/check-budget.mjs` | R12 |
| 2. Segurança | Hash de senha, cookie HttpOnly, rate limit, auditoria | scrypt + cookie opaco + lockout + `data/audit.jsonl` | `src/lib/auth/` (R7) |
| 2. Segurança | Upload validado | Tipo, tamanho e nome derivado; gravação dentro de `files/` | `src/lib/admin/upload.ts` |
| 3. Fluxo de Trabalho | Sem implementação antes da autorização | Esta fase é documentação; `tasks.md` só vira código com autorização | FR-134 do plano de execução |

**Nenhuma violação.** O único custo aceito de propósito está registrado em
Complexity Tracking.

**Revalidação pós-design (Phase 1)**: o design introduced `src/middleware.ts` para
`/files/**` — a constitution exige que a mídia seja servida em `/files/...` e o Astro
serve `public/` na raiz; o middleware é a solução explícita e portátil, sem introduzir
serviço novo. Todos os gates acima continuam válidos.

## Project Structure

### Documentation (this feature)

```text
specs/001-artist-site/
├── plan.md              # este arquivo
├── research.md          # Phase 0 — decisões e alternativas
├── data-model.md        # Phase 1 — entidades, campos, validações
├── quickstart.md        # Phase 1 — guia de validação executável
├── spec.md              # origem do escopo
├── checklists/
│   └── requirements.md  # quality checklist da spec
├── contracts/
│   ├── content-format.md # formato dos arquivos de conteúdo (contrato de dados)
│   └── api.md            # endpoints HTTP (contrato de API)
└── tasks.md             # Phase 2 — (/speckit.tasks)
```

### Source Code (repository root)

```text
/
├── content/                     # acervo versionado (escrito pela artista / backoffice)
│   ├── index.md                 # ordem das pastas
│   ├── <ano>/<mes>.md           # posts
│   ├── privado/<ano>/<mes>.md   # postagens privadas
│   ├── discografia/<slug>.md    # lançamentos, faixas, letras
│   ├── agenda/<slug>.md         # eventos da agenda (1 arquivo por evento)
│   └── colecoes/<slug>.md       # playlists nomeadas do player
│
├── files/                       # mídia versionada
│   ├── pics/<pasta>/            # imagens e cartazes do post
│   ├── videos/<pasta>/          # vídeos
│   └── audio/<lancamento>/      # faixas
│
├── data/                        # estado de runtime — FORA do git
│   ├── counters.json            # contadores de popularidade
│   ├── sessions.json            # sessões do backoffice
│   └── audit.jsonl              # registro de auditoria
│
├── public/                      # assets do próprio site
│   ├── favicon.svg
│   └── og-default.png
│
├── src/
│   ├── middleware.ts            # serve /files/** com Range, ETag e cache imutável
│   ├── layouts/
│   │   ├── BaseLayout.astro     # topo + conteúdo + player (as três faixas)
│   │   └── AdminLayout.astro    # casca do backoffice
│   ├── components/
│   │   ├── TopBar.astro         # marca, 4 links, lupa
│   │   ├── BottomPlayer.astro   # player compacto/expandido
│   │   ├── Mosaic.astro         # grade com tamanho por popularidade
│   │   ├── FeedList.astro       # lista vertical estilo Instagram
│   │   ├── Carousel.astro       # slider de mídias do post
│   │   ├── SearchBox.astro      # busca da home
│   │   ├── ThemeToggle.astro
│   │   ├── PostCard.astro
│   │   ├── ReleaseCard.astro
│   │   └── EventCard.astro
│   ├── pages/
│   │   ├── index.astro          # home — mosaico/feed
│   │   ├── timeline.astro
│   │   ├── agenda.astro
│   │   ├── discografia/index.astro
│   │   ├── discografia/[slug].astro
│   │   ├── post/[slug].astro
│   │   ├── contato.astro
│   │   ├── 404.astro
│   │   ├── api/
│   │   │   ├── search.ts        # GET  /api/search
│   │   │   └── click.ts         # POST /api/click
│   │   └── admin/
│   │       ├── login.astro
│   │       ├── index.astro      # painel
│   │       ├── posts.astro
│   │       ├── agenda.astro
│   │       ├── discografia.astro
│   │       └── estatisticas.astro
│   ├── actions/
│   │   └── index.ts             # Astro Actions: login/logout e CRUD do backoffice
│   ├── lib/
│   │   ├── content/
│   │   │   ├── types.ts         # entidades e tipos
│   │   │   ├── schema.ts        # validação (categoria enum, campos obrigatórios)
│   │   │   ├── repository.ts    # INTERFACES dos repositórios (contrato interno)
│   │   │   ├── file-post.repository.ts
│   │   │   ├── file-agenda.repository.ts
│   │   │   ├── file-release.repository.ts
│   │   │   ├── file-collection.repository.ts
│   │   │   ├── file-counter.store.ts
│   │   │   ├── file-session.store.ts
│   │   │   ├── file-audit.store.ts
│   │   │   ├── cache.ts         # invalidação por mtime
│   │   │   └── popularity.ts    # ordenação e escala de tamanho
│   │   ├── markdown.ts          # marked + yaml, HTML cru descartado
│   │   ├── media/
│   │   │   ├── image-size.ts    # leitor de cabeçalho (sem dependência)
│   │   │   └── serve.ts         # streaming com Range
│   │   ├── auth/
│   │   │   ├── password.ts      # scrypt
│   │   │   ├── session.ts       # cookie opaco, expiração
│   │   │   ├── rate-limit.ts    # lockout de login
│   │   │   └── guard.ts         # middleware de proteção das rotas admin
│   │   ├── git/commit.ts        # add + commit via child_process
│   │   ├── admin/upload.ts      # valida tipo/tamanho/nome
│   │   └── search.ts            # índice em memória
│   ├── styles/
│   │   ├── tokens.css           # design tokens (fonte única)
│   │   └── global.css
│   └── scripts/                 # JS do cliente, sem framework
│       ├── home-view.ts         # alternância mosaico/feed + ordenação
│       ├── home-search.ts       # filtro local da home
│       ├── global-search.ts     # lupa + debounce
│       ├── player.ts            # <audio> + fontes + volume
│       ├── carousel.ts          # slider + teclado
│       ├── theme.ts             # claro/escuro
│       └── click.ts             # sendBeacon do contador
│
├── scripts/
│   ├── check-budget.mjs         # gate de page weight
│   ├── validate-content.mjs     # gate de conteúdo (schema + mídia)
│   ├── prepare-assets.mjs       # script de assets (dev-only, usa sharp)
│   └── migrate-to-db.mjs        # migração futura para node:sqlite
│
├── tests/
│   ├── unit/                    # parsing, ordenação, validação, auth
│   ├── integration/             # repositórios + rotas via dev()/preview()
│   └── fixtures/                # acervo mínimo de teste
│
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── .nvmrc
├── .env.example
├── .gitignore                   # ignora data/ e .env
└── README.md                    # como publicar, deployar, operar
```

**Structure Decision**: aplicação única Astro em SSR na raiz do repositório, com o
acervo (`content/`, `files/`) e o estado (`data/`) **fora** de `src/`. Essa separação é
obrigatória: `content/` e `files/` são versionados e lidos em runtime pelo caminho
relativo à raiz do projeto (que precisa ser o `WorkingDirectory` do serviço na VPS), e
`data/` é estado mutável que não deve ir para o git. `src/` contém apenas código.
Dentro de `src/lib/content/`, a separação entre `repository.ts` (interfaces) e
`file-*.ts` (implementações) é o que mantém a porta aberta para o banco (FR-128).

## Complexity Tracking

> Nenhuma violação da constitution. O item abaixo é um custo aceito de propósito, para
> ficar registrado e não ser "simplificado" depois sem decisão.

| Custo aceito | Por que é necessário | Alternativa mais simples rejeitada porque |
|---|---|---|
| Camada de repositório (interfaces + implementação em arquivo) | Constitution Princípio VI e FR-127/125 exigem que o acesso a dados passe por interface estável, para que o banco entre depois sem tocar em página ou rota | Leitura direta de `fs` nas páginas seria mais curta, mas amarra o site ao formato de arquivo e torna a migração para banco um rewrite — exatamente o que a spec adia com a promessa de ser barato (FR-132, R14) |
| Leitor de cabeçalho de imagem próprio (~120 linhas) | FR-122 exige dimensões exatas no HTML para CLS < 0,1; `sharp` no runtime pesa ~30 MB e é nativo | `sharp` em runtime resolve a mesma coisa com peso nativo no servidor, contra a constitution (Princípio I e II) |
| Sessão e hash próprios (~200 linhas) | Constitution v2.0.0 exige hash com derivação lenta, cookie HttpOnly+SameSite com expiração, revogação no logout, lockout e auditoria | `bcrypt`/`argon2` nativo ou JWT: ou adicionam dependência nativa, ou perdem revogação imediata |
| `compressHTML: true` (desvio do default do Astro 7) | O default `'jsx'` do Astro 7 remove espaço entre elementos inline e quebra texto corrido em português | Manter o default do Astro 7: menos um ajuste de config, com custo de texto renderizado errado |

## Phase 0 — Research

Concluído. Ver [`research.md`](./research.md) — 14 decisões (R1–R14) com rationale e
alternativas rejeitadas. Nenhum `NEEDS CLARIFICATION` em aberto.

## Phase 1 — Design & Contracts

Concluído.

- Modelo de dados: [`data-model.md`](./data-model.md)
- Contratos: [`contracts/content-format.md`](./contracts/content-format.md),
  [`contracts/api.md`](./contracts/api.md)
- Guia de validação: [`quickstart.md`](./quickstart.md)

**Contratos novos e reutilizáveis**: o formato dos arquivos de conteúdo é contrato
entre a artista e o site — se mudar, os arquivos dela quebram. Por isso o formato tem
versão (`formato: 1` no frontmatter) e a validação é explícita no build.
