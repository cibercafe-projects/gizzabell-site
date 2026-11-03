---
description: "Task list for the independent artist website"
---

# Tasks: Site da Artista Independente — Gizza Bell

**Input**: Design documents from `specs/001-artist-site/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/content-format.md, contracts/api.md, quickstart.md

**Tests**: incluídos. A constitution (Princípio V) exige teste para rotas de API,
transformações de dados, ordenação por popularidade e métricas de performance; a spec
também exige comportamento verificável em SC-001 a SC-018.

> **Estas tarefas são de implementação.** A execução só começa após autorização
> explícita da artista (constitution, seção 3 — Fluxo de Trabalho).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: user story desta spec
- Caminhos exatos sempre

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: projeto, dependências, configuração e scripts de qualidade.

- [x] T001 Criar a árvore de diretórios do plano em `content/`, `files/pics`, `files/videos`, `files/audio`, `data/`, `public/`, `src/{components,layouts,pages,lib,styles,scripts,actions}`, `scripts/`, `tests/{unit,integration,fixtures}`
- [x] T002 Criar `package.json` com os scripts `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `validate:content`, `check-budget`, `seed:fixtures`, `admin:create`, `assets:prepare`, `migrate:db` e `test:repos`
- [x] T003 Instalar dependências de runtime `astro@7.4.5`, `@astrojs/node@11.1.9`, `yaml@2.9.1`, `marked@18.1.3`
- [x] T004 [P] Instalar dependências de desenvolvimento `typescript`, `@astrojs/check@0.9.12`, `vitest@5.1.0`, `eslint@9`, `eslint-plugin-astro`, `prettier`, `prettier-plugin-astro`, `sharp@0.35.5`
- [x] T005 Criar `astro.config.mjs` com `output: 'server'`, adapter `@astrojs/node` em modo standalone e `compressHTML: true` (o default `'jsx'` do Astro 7 remove espaço entre elementos inline e quebra texto corrido)
- [x] T006 [P] Criar `tsconfig.json` com `strict: true`, `moduleResolution: 'bundler'` e `include` de `src/**` e `tests/**`
- [x] T007 [P] Criar `.nvmrc` com `24` e `.gitignore` ignorando `data/`, `.env`, `dist/`, `node_modules/` e `.astro/`
- [x] T008 [P] Criar `.env.example` com `SESSION_SECRET`, `SITE_URL`, `ADMIN_USER` e `PORT`
- [x] T009 [P] Configurar ESLint flat config em `eslint.config.js` com `eslint-plugin-astro` e Prettier em `.prettierrc` com `prettier-plugin-astro`
- [x] T010 [P] Configurar `vitest.config.ts` com ambiente `node` e `include: ['tests/**/*.test.ts']`
- [x] T011 [P] Criar `src/styles/tokens.css` com os tokens de cor, tipografia, espaçamento, raio, sombra e brilho — fonte única, tema claro e escuro a partir dos mesmos tokens
- [x] T012 [P] Criar `src/styles/global.css` consumindo apenas `var(--*)`, com foco visível e alvo de toque mínimo de 44px

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: camada de dados, mídia, autenticação e casca visual. Bloqueia todas as stories.

**?? CRITICAL**: nenhuma story começa antes desta fase.

### Dados

- [x] T013 Criar `src/lib/content/types.ts` com as entidades `Post`, `Pasta`, `Lancamento`, `Faixa`, `EventoAgenda`, `ColecaoPlayer`, `ContadorPopularidade`, `ContaArtista`, `Sessao`, `RegistroAuditoria`
- [x] T014 Criar `src/lib/content/schema.ts` validando: `nome` 1–160 caracteres; `data` em ISO `YYYY-MM-DD`; `categoria` obrigatória e restrita a `feed`, `show`, `lancamento`, `evento`, `trabalhos`; `pasta` com slug `^[a-z0-9-]+$`; `midias` com pelo menos 1 item
- [x] T015 Criar `src/lib/content/repository.ts` com as interfaces `PostRepository`, `AgendaRepository`, `ReleaseRepository`, `CollectionRepository`, `CounterStore`, `SessionStore`, `AuditStore` — nenhum outro módulo importa as implementações `file-*.ts` diretamente (FR-127)
- [x] T016 Criar `src/lib/markdown.ts` com `yaml` para frontmatter e `marked` para o corpo, descartando HTML cru e normalizando links contra `javascript:` (FR-025)
- [x] T017 Criar `src/lib/content/cache.ts` invalidando por `mtime` do arquivo, sem manter descritor aberto
- [x] T018 Criar `src/lib/content/file-post.repository.ts` lendo `content/<ano>/<mes>.md` em multi-documento e `content/privado/<ano>/<mes>.md`, deduplicando slug por sufixo numérico
- [x] T019 [P] Criar `src/lib/content/file-agenda.repository.ts` lendo `content/agenda/<slug>.md`, um arquivo por evento
- [x] T020 [P] Criar `src/lib/content/file-release.repository.ts` lendo `content/discografia/<slug>.md` e casando `## Letra — <título>` com `faixas[].titulo`
- [x] T021 [P] Criar `src/lib/content/file-collection.repository.ts` lendo `content/colecoes/<slug>.md` com referências `<lançamento>/<faixa>`
- [x] T022 Criar `src/lib/content/file-counter.store.ts` em `data/counters.json` com escrita atômica (temp + rename) e flush agrupado de 1s
- [x] T023 [P] Criar `src/lib/content/file-session.store.ts` em `data/sessions.json`
- [x] T024 [P] Criar `src/lib/content/file-audit.store.ts` em `data/audit.jsonl`, uma linha JSON por evento
- [x] T025 Criar `src/lib/content/popularity.ts` com a ordenação por contagem decrescente, desempate estável por data e slug, e a escala discreta de tamanho dos tiles por posição no ranking (FR-032, FR-033)

### Mídia

- [x] T026 Criar `src/lib/media/image-size.ts` lendo largura e altura do cabeçalho de WebP, JPEG e PNG, sem dependência nativa
- [x] T027 Criar `src/lib/media/serve.ts` com streaming, suporte a `Range` (resposta 206), `ETag`, `Last-Modified` e `Cache-Control: public, max-age=31536000, immutable`
- [x] T028 Criar `src/middleware.ts` servindo `/files/**` a partir da pasta `files/` da raiz do repositório, bloqueando travessia de diretório (resposta 403)

### Autenticação e segurança

- [x] T029 Criar `src/lib/auth/password.ts` com hash `scrypt` (`node:crypto`), salt por conta, formato `scrypt$<N>$<r$p>$<salt>$<hash>` e comparação em tempo constante
- [x] T030 Criar `src/lib/auth/session.ts` com cookie opaco de 32 bytes, `HttpOnly`, `SameSite=Strict`, `Path=/`, `Secure` em produção e expiração de 8h
- [x] T031 Criar `src/lib/auth/rate-limit.ts` com bloqueio de 10 falhas em 15 minutos e token bucket de 60/min por IP para as rotas públicas de escrita
- [x] T032 Criar `src/lib/auth/guard.ts` exigindo sessão válida em toda rota sob `/admin`, redirecionando com 303 e sem revelar conteúdo protegido
- [x] T033 Criar `src/lib/git/commit.ts` executando `git add` + `git commit` via `node:child_process`, com push best-effort para `origin` que nunca falha a operação

### Casca visual

- [x] T034 Criar `src/layouts/BaseLayout.astro` com as três faixas — topo, conteúdo, player — presentes em todas as páginas públicas
- [x] T035 [P] Criar `src/components/ThemeToggle.astro` e `src/scripts/theme.ts` com `prefers-color-scheme` como padrão e script inline anti-FOUC
- [x] T036 [P] Criar `src/layouts/AdminLayout.astro` com casca do backoffice, distinta da pública

### Scripts de qualidade

- [x] T037 Criar `scripts/check-budget.mjs` falhando quando a primeira visualização passar de 150 KB comprimidos ou o JS de 30 KB gzip
- [x] T038 Criar `scripts/validate-content.mjs` validando schema, categoria, mês do arquivo, existência de mídia e de pasta, falhando com arquivo, linha e campo
- [x] T039 [P] Criar `tests/fixtures/acervo/` e `scripts/seed-fixtures.mjs` com posts, release, evento, coleção e mídia de teste
- [x] T040 [P] Criar `scripts/prepare-assets.mjs` usando `sharp` apenas em desenvolvimento para gerar WebP e poster

**Checkpoint**: fundação pronta — as stories podem começar.

---

## Phase 3: User Story 1 — Explorar a home em mosaico (Priority: P1) ★ MVP

**Goal**: home que mostra todos os posts em grade, com tiles proporcionais à popularidade.

**Independent Test**: abrir `/` e conferir um tile por post, com os mais clicados maiores,
`width`/`height` em toda `<img>` e o clique abrindo o post e somando 1 no contador.

### Tests for User Story 1

- [x] T041 [P] [US1] Teste de integração da home em `tests/integration/home-mosaic.test.ts`: um tile por post e ordem por popularidade decrescente
- [x] T042 [P] [US1] Teste de unidade da escala de tamanho em `tests/unit/popularity.test.ts`: tiers discretos por posição no ranking e desempate estável
- [x] T043 [P] [US1] Teste de integração do contador em `tests/integration/click.test.ts`: `POST /api/click` soma 1 e persiste em `data/counters.json`

### Implementation for User Story 1

- [x] T044 [P] [US1] Criar `src/components/PostCard.astro` com capa, nome e coleção, e `width`/`height` vindos de `src/lib/media/image-size.ts`
- [x] T045 [US1] Criar `src/components/Mosaic.astro` com grade de proporções variáveis e tamanho por posição no ranking
- [x] T046 [US1] Criar `src/pages/index.astro` renderizando o mosaico com todos os posts, ordenação e tamanho resolvidos no servidor
- [x] T047 [US1] Criar `src/pages/api/click.ts` com `POST`, corpo `{ post }`, resposta 204 e validação do slug
- [x] T048 [US1] Criar `src/scripts/click.ts` enviando o contador com `navigator.sendBeacon`, sem identificador de visitante

**Checkpoint**: US1 funciona isoladamente — a home já é um site visitável.

---

## Phase 4: User Story 2 — Navegar pelas quatro páginas do menu (Priority: P1)

**Goal**: barra de navegação fixa com marca, 4 links na ordem correta e lupa.

**Independent Test**: navegar por Página principal, Timeline, Agenda e Discografia e
conferir a ordem dos links e a presença da barra em todas as páginas.

### Tests for User Story 2

- [x] T049 [P] [US2] Teste de integração da navegação em `tests/integration/navigation.test.ts`: os quatro links na ordem Página principal, Timeline, Agenda, Discografia, com a lupa presente

### Implementation for User Story 2

- [x] T050 [P] [US2] Criar `src/components/TopBar.astro` com marca, quatro links e o botão da lupa, responsivo sem corte em celular
- [x] T051 [US2] Integrar `src/components/TopBar.astro` em `src/layouts/BaseLayout.astro`
- [x] T052 [US2] Criar `src/pages/404.astro` com navegação de volta à home
- [x] T053 [US2] Garantir que toda página pública responde 404 amigável para conteúdo inexistente, sem link quebrado

**Checkpoint**: US1 e US2 funcionam de forma independente.

---

## Phase 5: User Story 3 — Navegar pela home em modo feed (Priority: P1)

**Goal**: feed vertical estilo Instagram com mídia, nome e descrição, e slider de carrossel.

**Independent Test**: alternar para o feed e rolar a página, conferindo ordem por data
decrescente e o slider navegável por teclado.

### Tests for User Story 3

- [x] T054 [P] [US3] Teste de integração do feed em `tests/integration/home-feed.test.ts`: ordem por data decrescente e presença de nome e descrição em cada post
- [x] T055 [P] [US3] Teste de unidade do formato aparente em `tests/unit/post-format.test.ts`: 1 imagem → foto, 1 vídeo → vídeo, 2+ imagens → carrossel

### Implementation for User Story 3

- [x] T056 [P] [US3] Criar `src/components/Carousel.astro` com slider de mídias, indicador de posição e navegação por teclado
- [x] T057 [US3] Criar `src/components/FeedList.astro` com um bloco por post: mídia, nome, descrição e data
- [x] T058 [US3] Criar `src/scripts/carousel.ts` com avanço e retrocesso por teclado, toque e arrasto
- [x] T059 [US3] Renderizar o feed em `src/pages/index.astro` conforme o modo escolhido

**Checkpoint**: US1, US2 e US3 funcionam.

---

## Phase 6: User Story 4 — Alternar entre feed e mosaico (Priority: P1)

**Goal**: alternador na home, sem recarregar a página, com preferência memorizada.

**Independent Test**: alternar mosaico → feed → mosaico, recarregar e conferir que o modo
escolhido persiste; sem escolha, o padrão é mosaico.

### Tests for User Story 4

- [x] T060 [P] [US4] Teste de integração da preferência em `tests/integration/view-mode.test.ts`: mosaico como padrão e persistência após recarregar

### Implementation for User Story 4

- [x] T061 [US4] Criar `src/scripts/home-view.ts` com a alternância sem reload, preservando a posição de rolagem
- [x] T062 [US4] Criar o controle de visualização em `src/components/` e ligá-lo à home
- [x] T063 [US4] Persistir o modo escolhido em `localStorage` e aplicar no primeiro render do servidor

**Checkpoint**: US1 a US4 — a home está completa.

---

## Phase 7: User Story 5 — Ordenar por data, pasta ou popularidade (Priority: P2)

**Goal**: três ordenações, com mosaico em popularidade e feed em data por padrão.

**Independent Test**: alternar a ordenação e conferir a sequência de slugs no HTML.

### Tests for User Story 5

- [x] T064 [P] [US5] Teste de unidade das ordenações em `tests/unit/ordering.test.ts`: data decrescente, pasta pela ordem de `content/index.md` e popularidade decrescente
- [x] T065 [P] [US5] Teste de integração das ordenações em `tests/integration/ordering.test.ts`: a ordenação por pasta respeita o índice e as pastas não listadas vão ao final em ordem alfabética

### Implementation for User Story 5

- [x] T066 [US5] Implementar a ordenação por pasta em `src/lib/content/file-post.repository.ts` usando `content/index.md`
- [x] T067 [US5] Expor as três ordenações em `src/pages/index.astro`, resolvidas no servidor
- [x] T068 [US5] Adicionar o controle de ordenação em `src/scripts/home-view.ts` e persistir a escolha

**Checkpoint**: US5 completa.

---

## Phase 8: User Story 6 — Consultar a timeline (Priority: P2)

**Goal**: lista única cronológica com os posts de categoria `show`, `lancamento`, `evento` e `trabalhos`.

**Independent Test**: abrir `/timeline` e conferir que nenhum post de categoria `feed`
nem privado aparece, e que a ordem é cronológica inversa.

### Tests for User Story 6

- [x] T069 [P] [US6] Teste de integração da timeline em `tests/integration/timeline.test.ts`: exclusão de `feed` e de privados, ordem cronológica inversa, presença de capa, nome, data, rótulo e resumo

### Implementation for User Story 6

- [x] T070 [US6] Criar `src/pages/timeline.astro` com a lista única e o filtro por categoria no repositório
- [x] T071 [US6] Garantir que posts privados e de categoria `feed` nunca sejam serializados para a timeline

**Checkpoint**: US6 completa.

---

## Phase 9: User Story 7 — Consultar a agenda de eventos (Priority: P2)

**Goal**: agenda pública com próximos eventos, histórico, cartaz e links.

**Independent Test**: abrir `/agenda`, ver o próximo evento com data, local e cartaz e
alternar para os eventos passados.

### Tests for User Story 7

- [x] T072 [P] [US7] Teste de integração da agenda em `tests/integration/agenda.test.ts`: ordem por data, separação futuro/passado, cartaz e link externo com `target="_blank"`

### Implementation for User Story 7

- [x] T073 [P] [US7] Criar `src/components/EventCard.astro` com cartaz, título, data, local e links, com visual substituto quando não há cartaz
- [x] T074 [US7] Criar `src/pages/agenda.astro` com a alternância entre futuros e passados

**Checkpoint**: US7 completa.

---

## Phase 10: User Story 8 — Consultar a discografia completa (Priority: P2)

**Goal**: lista de lançamentos e página por lançamento com tracklist e letras.

**Independent Test**: abrir `/discografia`, entrar num lançamento e conferir a tracklist
com a letra de uma faixa.

### Tests for User Story 8

- [x] T075 [P] [US8] Teste de integração da discografia em `tests/integration/discografia.test.ts`: ordenação por ano, tipos, tracklist e letra expandível
- [x] T076 [P] [US8] Teste de integração da letra ausente em `tests/integration/discografia.test.ts`: a faixa continua na tracklist com indicação de ausência

### Implementation for User Story 8

- [x] T077 [P] [US8] Criar `src/components/ReleaseCard.astro` com capa, tipo, ano e número de faixas
- [x] T078 [US8] Criar `src/pages/discografia/index.astro` com a lista de lançamentos do mais recente ao mais antigo
- [x] T079 [US8] Criar `src/pages/discografia/[slug].astro` com a tracklist, a letra expansível por faixa e a ação de tocar a faixa

**Checkpoint**: US8 completa.

---

## Phase 11: User Story 9 — Ouvir música pelo player do rodapé (Priority: P2)

**Goal**: player compacto que abre e minimiza, com fontes coleção/EP/álbum/aleatória e volume.

**Independent Test**: tocar uma faixa, trocar a fonte, ajustar o volume, minimizar e
navegar mantendo o áudio.

### Tests for User Story 9

- [x] T080 [P] [US9] Teste de unidade das fontes do player em `tests/unit/player-sources.test.ts`: lançamentos (padrão) em ordem do mais novo ao mais antigo, coleção, EP, álbum e aleatória sem repetir até percorrer a playlist
- [x] T081 [P] [US9] Teste de unidade da ordem de recência dos lançamentos em `tests/unit/release-order.test.ts`: `data` decrescente, depois `ano` decrescente, depois `slug` como desempate estável

### Implementation for User Story 9

- [x] T082 [US9] Criar `src/components/BottomPlayer.astro` com estado compacto e expandido, faixa atual, play/pausa, anterior, próxima e volume
- [x] T083 [US9] Criar `src/scripts/player.ts` com `<audio>` nativo, as cinco fontes (lançamentos como padrão, coleção, EP, álbum, aleatória), o volume memorizado e o estado aberto/compacto memorizado
- [x] T084 [US9] Implementar a ordem de recência dos lançamentos em `src/lib/content/file-release.repository.ts`, expondo `listPorRecencia()` com `data` decrescente, `ano` decrescente e `slug` como desempate
- [x] T085 [US9] Integrar `src/components/BottomPlayer.astro` em `src/layouts/BaseLayout.astro`, garantindo que a reprodução continua na navegação
- [x] T086 [US9] Tratar falha de carregamento de áudio exibindo erro e oferecendo pular para a próxima faixa

**Checkpoint**: US9 completa.

---

## Phase 12: User Story 10 — Pesquisar posts na home (Priority: P2)

**Goal**: campo na home que filtra os posts por nome e descrição, sem requisição.

**Independent Test**: digitar uma palavra do nome e ver só os posts correspondentes,
sem requisição ao servidor.

### Tests for User Story 10

- [x] T087 [P] [US10] Teste de unidade do filtro em `tests/unit/home-filter.test.ts`: correspondência por nome e descrição, ignorando acentos e maiúsculas, e estado vazio

### Implementation for User Story 10

- [x] T088 [US10] Criar `src/components/SearchBox.astro` com o campo de busca da home
- [x] T089 [US10] Criar `src/scripts/home-search.ts` filtrando os posts já carregados, sem chamada ao servidor, com ação de limpar e estado vazio
- [x] T090 [US10] Permitir abrir o termo na busca global a partir do campo da home

**Checkpoint**: US10 completa.

---

## Phase 13: User Story 11 — Buscar em todo o site pela lupa (Priority: P3)

**Goal**: busca global em posts, eventos, lançamentos e faixas, com debounce.

**Independent Test**: digitar na lupa e conferir os resultados tipados e o estado vazio.

### Tests for User Story 11

- [x] T091 [P] [US11] Teste de integração da busca global em `tests/integration/search.test.ts`: posts, eventos, lançamentos e faixas, estado vazio e termo curto com 400

### Implementation for User Story 11

- [x] T092 [P] [US11] Criar `src/lib/search.ts` com o índice em memória, invalidado por `mtime`, cobrindo posts, eventos, lançamentos e a letra das músicas
- [x] T093 [US11] Criar `src/pages/api/search.ts` com `GET /api/search?q=&limite=&tipo=`, exigindo 2 caracteres no termo
- [x] T094 [US11] Criar `src/scripts/global-search.ts` com a lupa, debounce de 300ms e navegação por teclado nos resultados
- [x] T095 [US11] Garantir que a busca global nunca revela posts privados nem itens privados de releases

**Checkpoint**: US11 completa.

---

## Phase 14: User Story 12 — Entrar em contato (Priority: P3)

**Goal**: contato por e-mail e redes, sem formulário.

**Independent Test**: abrir `/contato` e acionar o e-mail, conferindo o endereço preenchido.

### Tests for User Story 12

- [x] T096 [P] [US12] Teste de integração do contato em `tests/integration/contato.test.ts`: link `mailto:` com o endereço preenchido, links de redes e ausência de formulário

### Implementation for User Story 12

- [x] T097 [US12] Criar `src/pages/contato.astro` com e-mail, redes e sem formulário
- [x] T098 [US12] Definir o e-mail e as redes em um único lugar de configuração, sem repetição em componentes

**Checkpoint**: US12 completa.

---

## Phase 15: User Story 13 — A artista entrar no backoffice (Priority: P3)

**Goal**: login com usuário e senha exclusivos da artista, sessão e lockout.

**Independent Test**: entrar com a credencial correta, ver o painel, sair; tentar senha
errada e ser bloqueado após 10 tentativas.

### Tests for User Story 13

- [x] T099 [P] [US13] Teste de integração da autenticação em `tests/integration/auth.test.ts`: login válido, cookie `HttpOnly` e `SameSite=Strict`, logout, rota protegida sem sessão respondendo 303, mensagem genérica em falha
- [x] T100 [P] [US13] Teste de unidade do lockout em `tests/unit/rate-limit.test.ts`: 10 falhas bloqueiam por 15 minutos e a tentativa é registrada
- [x] T101 [P] [US13] Teste de unidade do hash em `tests/unit/password.test.ts`: scrypt com salt por conta e comparação em tempo constante

### Implementation for User Story 13

- [x] T102 [US13] Criar `src/pages/admin/login.astro` com o formulário e as mensagens de erro, sem revelar se o usuário existe
- [x] T103 [US13] Criar `src/actions/index.ts` com as ações `login` e `logout`, definindo o cookie de sessão e encerrando a sessão
- [x] T104 [US13] Criar `scripts/create-admin.mjs` (`npm run admin:create`) provisionando a conta única com hash scrypt
- [x] T105 [US13] Registrar falhas e sucessos de login em `data/audit.jsonl`

**Checkpoint**: US13 completa — o backoffice passa a ser acessível.

---

## Phase 16: User Story 14 — Cadastrar evento da agenda pelo backoffice (Priority: P3)

**Goal**: a artista cadastra, edita e remove eventos com data, título, descrição e cartaz.

**Independent Test**: cadastrar um evento e ver na agenda pública em até 5 segundos, com
commit no git.

### Tests for User Story 14

- [x] T106 [P] [US14] Teste de integração do CRUD de eventos em `tests/integration/admin-agenda.test.ts`: criação, edição, remoção e reflexo na agenda pública em até 5 segundos
- [x] T107 [P] [US14] Teste de integração do upload em `tests/integration/admin-upload.test.ts`: tipo inválido, tamanho excedido e nome de arquivo gerado

### Implementation for User Story 14

- [x] T108 [US14] Criar `src/pages/admin/agenda.astro` com a listagem e o formulário de evento
- [x] T109 [US14] Criar as ações `upsertEvento` e `removeEvento` em `src/actions/index.ts`, gravando `content/agenda/<slug>.md`
- [x] T110 [US14] Criar `src/lib/admin/upload.ts` validando tipo por assinatura de arquivo, limite de tamanho (5 MB imagem, 50 MB vídeo, 15 MB áudio) e nome derivado, gravando sempre dentro de `files/`
- [x] T111 [US14] Criar o commit automático via `src/lib/git/commit.ts` com mensagem descritiva e autoria

**Checkpoint**: US14 completa.

---

## Phase 17: User Story 15 — Publicar uma postagem pelo backoffice (Priority: P3)

**Goal**: a artista publica post com nome, categoria, mídias e descrição, e marca como secreto.

**Independent Test**: publicar um post e conferir que ele aparece na home e, conforme a
categoria, na timeline — e que um post secreto não aparece em página pública.

### Tests for User Story 15

- [x] T112 [P] [US15] Teste de integração da publicação em `tests/integration/admin-posts.test.ts`: post público por categoria, post secreto invisível publicamente e remoção de post existente

### Implementation for User Story 15

- [x] T113 [US15] Criar `src/pages/admin/posts.astro` com o formulário de post, o combo select de categoria (`feed`, `show`, `lancamento`, `evento`, `trabalhos`) e a marcação de privado
- [x] T114 [US15] Criar as ações `upsertPost` e `removePost` em `src/actions/index.ts`, gravando em `content/<ano>/<mes>.md` ou `content/privado/<ano>/<mes>.md`
- [x] T115 [US15] Gerar o nome da pasta do post como `dd-mm-aaa-hh-mm-ss-<slug-do-nome>` no momento do cadastro, com sufixo numérico quando já existir pasta com o mesmo nome (FR-012)
- [x] T116 [US15] Registrar cada alteração em `data/audit.jsonl` com autor, data e campos alterados

**Checkpoint**: US15 completa.

---

## Phase 18: User Story 16 — Acompanhar os cliques no backoffice (Priority: P3)

**Goal**: painel com o ranking de posts por número de cliques.

**Independent Test**: clicar em um post como visitante e ver o contador no painel.

### Tests for User Story 16

- [x] T117 [P] [US16] Teste de integração das estatísticas em `tests/integration/admin-stats.test.ts`: ordenação por cliques, total e posição no ranking, exigindo sessão

### Implementation for User Story 16

- [x] T118 [US16] Criar `src/pages/admin/estatisticas.astro` com a tabela de ranking, total e posição
- [x] T119 [US16] Expor `ranking()` em `src/lib/content/file-counter.store.ts` ordenando por cliques decrescentes com desempate por nome

**Checkpoint**: US16 completa.

---

## Phase 19: User Story 17 — Gerenciar a discografia e as faixas (Priority: P3)

**Goal**: a artista cadastra lançamentos, faixas, letras e o vínculo do áudio.

**Independent Test**: cadastrar um lançamento com duas faixas e letra e ver na
discografia pública, com as faixas tocáveis.

### Tests for User Story 17

- [x] T120 [P] [US17] Teste de integração do CRUD de lançamentos em `tests/integration/admin-discografia.test.ts`: criação, edição, remoção e reflexo na discografia pública

### Implementation for User Story 17

- [x] T121 [US17] Criar `src/pages/admin/discografia.astro` com a listagem e o formulário de lançamento
- [x] T122 [US17] Criar as ações `upsertRelease` e `removeRelease` em `src/actions/index.ts`, gravando `content/discografia/<slug>.md` com as seções `## Letra — <título>`
- [x] T123 [US17] Permitir vincular o arquivo de áudio em `files/audio/` à faixa, deixando a faixa não tocável quando ausente

**Checkpoint**: US17 completa.

---

## Phase 20: User Story 18 — Publicar um post sem mexer em código (Priority: P3)

**Goal**: publicar exige apenas adicionar a mídia e escrever a entrada no arquivo do mês.

**Independent Test**: copiar uma foto para a pasta do post, acrescentar a entrada no
arquivo do mês e rodar o build — o post aparece na home e na busca.

### Tests for User Story 18

- [x] T124 [P] [US18] Teste de integração da validação em `tests/integration/content-validation.test.ts`: campo ausente, categoria inválida, data fora do mês, mídia inexistente e pasta inexistente, cada um com arquivo, linha e campo

### Implementation for User Story 18

- [x] T125 [US18] Ligar `scripts/validate-content.mjs` ao `npm run build`, falhando com arquivo, linha e campo
- [x] T126 [US18] Criar `README.md` com o passo a passo para a artista publicar (criar pasta, copiar mídia, escrever no arquivo do mês, atualizar o índice de pastas)
- [x] T127 [US18] Criar `docs/` com o guia de formatos, o de publicação e o de operação da VPS

**Checkpoint**: US18 completa — a artista publica sozinha.

---

## Phase 21: Polish & Cross-Cutting Concerns

**Purpose**: o que atravessa todas as stories.

- [x] T128 [P] Criar `README.md` com setup, scripts, publicação e operação
- [x] T129 [P] Criar `deploy/gizzabell-site.service` (systemd) e `deploy/Caddyfile` com `WorkingDirectory` na raiz do projeto
- [x] T130 [P] Criar `scripts/migrate-to-db.mjs` lendo `content/` e gravando em `node:sqlite`, sem tocar em páginas e rotas (FR-132)
- [ ] T131 [P] Criar `tests/integration/repos-contract.test.ts` executando o mesmo conjunto de casos contra a implementação em arquivo e a de banco (SC-018)
- [x] T132 Revisar segurança: nenhum segredo no cliente, cookie `HttpOnly`/`SameSite`, upload sem travessia de diretório, rate limit ativo
- [x] T133 Rodar os quality gates (`lint`, `typecheck`, `test`, `build`) e corrigir até passarem
- [x] T134 Validar o orçamento de peso com `npm run check-budget -- --detalhe` e registrar o resultado
- [ ] T135 Validar a acessibilidade manualmente conforme `quickstart.md` seção 5.11: teclado, foco visível, alvo de 44px, contraste AA e leitura sem JavaScript
- [ ] T136 Executar todos os cenários de `quickstart.md` (5.1 a 5.11)
- [x] T137 Escrever `docs/deploy.md` com o procedimento de deploy e de recuperação

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende da Setup — **bloqueia todas as stories**
- **User Stories (Phase 3 a 20)**: dependem da Foundational; são independentes entre si
- **Polish (Phase 21)**: depende das stories desejadas

### User Story Dependencies

- **US1 (P1)**: sem dependência de outras stories — é o MVP
- **US2 (P1)**: sem dependência
- **US3 (P1)**: reusa a casca da US2
- **US4 (P1)**: depende de US1 e US3 (alterna entre os dois modos)
- **US5 (P2)**: depende de US1 (mosaico) e US3 (feed)
- **US6 (P2)**: sem dependência — consome o repositório de posts
- **US7 (P2)**: sem dependência — consome o repositório de agenda
- **US8 (P2)**: sem dependência — consome o repositório de lançamentos
- **US9 (P2)**: sem dependência — consome o repositório de faixas
- **US10 (P2)**: depende de US1 (posts carregados na home)
- **US11 (P3)**: sem dependência
- **US12 (P3)**: sem dependência
- **US13 (P3)**: sem dependência — pré-requisito de US14 a US17
- **US14 (P3)**: depende de US13 (sessão) e do repositório de agenda (US7)
- **US15 (P3)**: depende de US13 (sessão) e do repositório de posts (US1)
- **US16 (P3)**: depende de US13 (sessão) e do contador (US1)
- **US17 (P3)**: depende de US13 (sessão) e do repositório de lançamentos (US8)
- **US18 (P3)**: depende de US1 e da validação de conteúdo

### Within Each User Story

- Testes primeiro, e devem falhar antes da implementação
- Modelos antes de serviços; serviços antes de rotas; núcleo antes de integração
- Story completa antes de passar à próxima

### Parallel Opportunities

- Todas as tarefas `[P]` da Setup e da Foundational
- Testes de uma story em paralelo entre si; modelos de uma story em paralelo entre si
- Depois da Foundational, US2, US6, US7, US8, US9, US11, US12 e US13 em paralelo
- US14 a US17 em paralelo entre si depois de US13

---

## Parallel Example: User Story 1

```bash
# Lançar os testes de US1 juntos:
Task: "Teste de integração da home em tests/integration/home-mosaic.test.ts: um tile por post e ordem por popularidade decrescente"
Task: "Teste de unidade da escala de tamanho em tests/unit/popularity.test.ts: tiers discretos por posição no ranking e desempate estável"
Task: "Teste de integração do contador em tests/integration/click.test.ts: POST /api/click soma 1 e persiste em data/counters.json"

# Lançar os modelos de US1 juntos:
Task: "Criar src/components/PostCard.astro com capa, nome e coleção, e width/height vindos de src/lib/media/image-size.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: User Story 1
4. **STOP e VALIDAR**: testar US1 isoladamente
5. Deploy de demonstração

### Entrega incremental

1. Setup + Foundational → fundação pronta
2. US1 → testar → entregar (MVP)
3. US2, US3, US4 → home completa e navegável
4. US5 a US12 → acervo, timeline, agenda, discografia, player, buscas
5. US13 a US17 → backoffice
6. US18 → a artista publica sozinha
7. Polish → deploy e operação

### Estratégia com time

Depois da Foundational, US1 fica com um time, o backoffice (US13–US17) com outro, e as
páginas de conteúdo (US6–US9) com um terceiro. As stories se integram ao final.

---

## Notes

- `[P]` = arquivos diferentes, sem dependência
- `[Story]` mapeia a tarefa para a story da spec, rastreabilidade
- Verificar que os testes falham antes de implementar
- Commit após cada tarefa ou grupo lógico
- Parar em qualquer checkpoint para validar a story isoladamente
- Evitar: tarefas vagas, conflitos de arquivo no mesmo `[P]`, dependência cruzada que
  quebre a independência
- **Nenhuma tarefa deste arquivo começa sem autorização explícita da artista**
  (constitution v2.3.1, seção 3)
