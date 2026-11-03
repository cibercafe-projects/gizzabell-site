# Phase 0 — Research

**Feature**: Site da Artista Independente — Gizza Bell
**Date**: 2026-11-02
**Contexto**: 131 FRs, 18 SCs, 18 user stories. Spec em `specs/001-artist-site/spec.md`.

Cada item abaixo é uma decisão de implementação com a alternativa avaliada e o motivo.
Nenhuma dependência desnecessária foi aceita: a constitution v2.3.1 impõe orçamento de
150 KB/30 KB e proíbe serviços de terceiros no caminho crítico.

---

## R1 — Framework e modo de renderização

**Decisão**: Astro 7.4.5 em `output: 'server'` (SSR) com o adapter `@astrojs/node` 11.1.9,
servido como processo Node único (modo `standalone`).

**Rationale**:
- FR-130 exige que uma alteração de conteúdo valha em até 5 segundos **sem republicação
  manual**. Com build estático, o backoffice escreveria arquivo mas a página só mudaria
  no próximo build — violação direta do requisito. SSR elimina a etapa de republicação.
- FR-071 (publicar post sem mexer em código) e FR-129 (backoffice grava arquivo + commit)
  só fecham o ciclo se o servidor reler o acervo a cada requisição.
- Astro com `output: 'server'` entrega zero JavaScript de framework por padrão, o que
  satisfaz a constitution (Princípio I) sem luta: o HTML chega pronto do servidor.
- Processo único Node: a constitution (Princípio II) exige uma única aplicação, sem
  microsserviços.

**Alternativas avaliadas**:
- *Next.js*:pesado para o orçamento e traz runtime de React desnecessário. Rejeitado.
- *Gerador estático puro (Eleventy) + revalidação*: exigiria rebuild ou um segundo
  processo de revalidação; Adds complexidade contra o princípio de simplicidade.
  Rejeitado.
- *Híbrido (estático + ilhas SSR)*: possível, mas a home precisa de ranking dinâmico por
  popularidade resolvido no servidor (FR-034) — o SSR é simpler que isolar essa parte.
  Rejeitado.

**Consequências a registrar no plano**:
- `compressHTML: true` no `astro.config.mjs`. O default do Astro 7 é `'jsx'`, que
  remove espaço entre elementos inline e quebraria texto corrido em português
  (`<span>olá</span><em>mundo</em>` viraria "olámundo").
- Compilador Rust do Astro 7 é estrito: tags precisam ser fechadas e não pode haver
  `<div>` dentro de `<p>`. Templates serão escritos com HTML válido.
- `src/fetch.ts` é nome reservado no Astro 7 (advancedRouting). Não será usado.

---

## R2 — Onde mora o acervo e como ele é lido

**Decisão**: acervo em `content/` e `files/`, lido por um **repositório próprio**
(`src/lib/content/`), com cache invalidado por `mtime`. **Não** usar Content Collections
do Astro.

**Rationale**:
- FR-127 proíbe acesso direto ao disco/bando de fora dos repositórios; FR-128 exige que
  a implementação seja intercambiável. Content Collections amarra o formato ao schema
  do Astro e ao loader — trocar por banco depois exigiria reescrever as coleções, não
  só a implementação. O repositório próprio mantém a interface estável.
- Cache por `mtime` em vez de `fs.watch`: não mantém descritor de arquivo aberto (que
  estoura em deploys), funciona igual em rede e em CI, e é previsível. Reavaliar o custo
  de um `stat` por requisição: irrelevante para o volume previsto.

**Alternativas avaliadas**:
- *Content Collections com glob loader*: acoplamento ao schema do Astro; rejeitado.
- *`fs.watch`*:watcher por processo, reinício em deploy, comportamento diferente entre
  Linux e Windows; rejeitado em favor de `mtime`.

---

## R3 — Formato dos arquivos e parsing

**Decisão**: Markdown multi-documento. YAML com a biblioteca `yaml` 2.9.1; corpo em
Markdown renderizado por `marked` 18.1.3, com **HTML cru descartado** no renderizador.

**Rationale**:
- A spec (FR-020, FR-021) exige metadados por post e descrição livre, em arquivo por
  ano/mês. Multi-documento resolve: cada post é um bloco `---` + frontmatter + corpo.
- `yaml` e `marked` são as duas únicas dependências de parsing, ambas pequenas e sem
  dependências transitivas relevantes.
- `marked` com `renderer.html = () => ''` elimina a necessitate de sanitizador: HTML
  crusome do acervo não é renderizado, e links são normalizados contra `javascript:`.
  Isso satisfaz FR-025 ("renderizadas com segurança") com menos dependência.
- O pipeline Markdown nativo do Astro 7 (Sätteri) existe para `.md` dentro de `src/`;
  o acervo fica fora de `src/`, então é processado por nós. Não vale acoplar.

**Alternativas avaliadas**:
- *Frontmatter único com array `posts:` no YAML*: descrição longa em YAML éhoderna para
  a artista editar; rejeitado.
- *Um arquivo por post*: contradiz o requisito explícito de "arquivo por ano e cada mês";
  rejeitado.

---

## R4 — Imagens: dimensões sem dependência nativa

**Decisão**: ler largura/altura do **cabeçalho do arquivo** (WebP, JPEG, PNG) com um
leitor próprio de ~120 linhas, cacheado por `caminho + mtime`. `sharp` fica **apenas**
como devDependency, num script de preparo de assets (`npm run assets:prepare`).

**Rationale**:
- FR-122 (imagens com dimensões declaradas) e SC-002 (CLS < 0,1) exigem dimensões
  exatas no HTML. Sem elas, o grid do mosaico salta.
- `sharp` é dependência nativa pesada (~30 MB) e a constitution exige runtime leve.
  Usá-la só em desenvolvimento mantém o servidor enxuto e a imagem pronta já otimizada
  em WebP.
- Um leitor de cabeçalho é leitura de poucos bytes por arquivo, cacheável, e não
  adiciona dependência nenhuma.

**Alternativas avaliadas**:
- *`sharp` no runtime*: peso nativo no servidor; rejeitado.
- *A artista declarar largura/altura no arquivo de conteúdo*: erro humano garantido e
  atrito na publicação; rejeitado.
- *Astro `<Image>` com service do sharp*: mesma dependência nativa; rejeitado.

---

## R5 — Serving de `/files/**` e vídeo

**Decisão**: middleware Astro (`src/middleware.ts`) serve `/files/**` a partir da pasta
`files/` da raiz do repositório, com suporte a **HTTP Range**, `ETag`,
`Last-Modified` e `Cache-Control: public, max-age=31536000, immutable`.

**Rationale**:
- A artista pediu a pasta `/files` na **raiz do projeto**; o Astro serve `public/` na
  raiz do site. Symlink `public/files → ../files` funciona, mas quebra em Windows,
  em archive/zip e em alguns setups de CI. Um middleware é explícito e portátil.
- Range request não é opcional: sem ele, `seek` de vídeo no player e no iOS não
  funciona, e o Safari não reproduz vídeo sem `Accept-Ranges`.
- `immutable` + ETag é seguro porque o conteúdo da mídia muda por versionamento, não
  por URL (regra já escrita na constitution, seção Deploy).

**Alternativas avaliadas**:
- *Mover `files/` para dentro de `public/`*: contraria a decisão da artista; rejeitado.
- *Servir `files/` pelo reverse proxy (Caddy/nginx)*: tiraria carga do Node, mas
  duplica a regra de cache em dois lugares e exige reconfig fora do repositório;
  rejeitado por simplicidade (Princípio II). Nota: pode ser adicionado depois sem
  tocar no código.

---

## R6 — Contadores de popularidade

**Decisão**: store em `data/counters.json` (fora do git), escrita atômica
(arquivo temporário + `rename`), com flush agrupado (debounce de 1 s) e escrita
imediata no encerramento. Endpoint `POST /api/click` com corpo `{ post: "<slug>" }`,
aceitando também `navigator.sendBeacon`. Limite de vazão por IP em memória
(token bucket, 60/min).

**Rationale**:
- FR-038 exige persistência entre reinicializações; `data/counters.json` resolve sem
  banco, coerente com a decisão "arquivo agora, banco depois".
- Escrita atômica evita arquivo corrompido se o processo cair no meio do `writeFile`.
- Debounce evita escrita em disco a cada clique (que seria o gargalo real).
- Sem cookie de identificação: FR-037 exige contagem agregada, sem identificar a
  visitante. O limite por IP é proteção de recurso, não rastreamento — e usa o IP
  apenas em memória, sem persistir.

**Alternativas avaliadas**:
- *SQLite já agora*: antecipa a migração que a spec adia (FR-134); rejeitado.
- *Contador em memória*: perderia dados no restart (FR-038); rejeitado.

---

## R7 — Autenticação e sessão do backoffice

**Decisão**: hash de senha com `node:crypto` **scrypt** (salt por conta, N=2^15),
cookie de sessão **opaco e aleatório** (`HttpOnly`, `SameSite=Strict`, `Path=/`,
`Secure`, expiração de 8 h), store em `data/sessions.json`, rate limit de login em
memória (10 falhas → bloqueio de 15 min), CSRF por header customizado `X-Requested-With`
**e** `SameSite=Strict`.

**Rationale**:
- Constitution v2.0.0 (segurança): hash com derivação lenta, cookie HttpOnly+SameSite
  com expiração, falha de login sem revelar existência de usuário, bloqueio temporário
  e registro de tentativas.
- `scrypt` é do próprio Node (`node:crypto`) → zero dependência, atende "derivação
  lenta" sem `argon2` nativo.
- Sessão opaca em cookie, não JWT: revogação imediata no logout é requisito implícito de
  "sessão encerrada" (User Story 13) e JWT não revoga sem lista de bloqueio.
- `SameSite=Strict` + header custom dispensam token CSRF adicional.

**Alternativas avaliadas**:
- *JWT*: stateless, mas sem revogação simples e com mais superfície de falha; rejeitado.
- *`bcrypt`/`argon2` (pacote npm)*: dependência nativa; rejeitado.
- *Astro Sessions (driver em memória/disco)*: mais simples, mas o controle de
  expiração, revogação e formato de cookie fica menos explícito — optamos por
  implementação própria e pequena, com a mesma interface para troca futura.

---

## R8 — Backoffice: escrita em arquivo + commit

**Decisão**: o backoffice grava o arquivo Markdown via repositório e cria commit com
`node:child_process` executando `git` (sem biblioteca), com mensagem descritiva e
autoria. Push para `origin` é **best-effort**: se falhar, o commit fica local, o site
continua funcionando e nenhum dado se perde.

**Rationale**:
- FR-129 exige arquivo + commit automático; a constitution (Princípio VI) exige que o
  git seja o histórico, o backup e a auditoria.
- `child_process` + binário `git` evita dependência (`simple-git` traz ~1 MB e
  abstrações desnecessárias para `add` + `commit`).

**Alternativas avaliadas**:
- *`simple-git`*: rejeitado (peso).
- *Gravar em banco e exportar para arquivo*: rechaçado — inverte a decisão do usuário
  e duplica a fonte de verdade.

**Risco registrado**: o commit ocorre no repositório da VPS. Se a VPS tiver commit local
e o deploy fizer `git pull`, há conflito. Mitigação definida: o deploy da VPS faz
`git pull --rebase` **antes** de qualquer build, e o backoffice faz push best-effort
para `origin` — o conflito é resolvido por rebase na atualização, sem perda.

---

## R9 — Busca

**Decisão**: dois mecanismos, deliberadamente separados.
1. **Busca da home** (FR-045): filtro **no cliente** sobre os posts já carregados,
   por nome e descrição. Zero requisições.
2. **Busca global** (FR-048, lupa do topo): endpoint `GET /api/search?q=&limite=`,
   com índice em memória,invalidado por `mtime`; cliente com debounce de 300 ms.

**Rationale**:
- FR-045 exige explicitamente filtro sem nova requisição; FR-050 exige que a busca
  global **não** dispare requisição a cada tecla (o que implica que ela **é** uma
  requisição, com debounce).
- O índice em memória é suficiente para o volume previsto; um índice persistido seria
  mais complexo sem ganho.
- A busca global varre posts, eventos, lançamentos e faixas — incluindo a letra das
  músicas (FR-048).

**Alternativas avaliadas**:
- *Enviar o índice inteiro ao cliente*: cresce sem limite e quebra o orçamento de
  150 KB (Princípio I); rejeitado.
- *Um único mecanismo para as duas*: a busca da home precisa ser instantânea e sem
  rede; rejeitado.

---

## R10 — Player de música

**Decisão**: elemento `<audio>` nativo + um controlador em JS puro (~3–5 KB, sem
framework). Fontes de reprodução (FR-079): **lançamentos** (padrão), **coleção**
(playlist nomeada), **EP** (releases de tipo EP, com escolha de qual), **álbum**
(releases de tipo álbum, com escolha de qual) e **aleatória**.

**Rationale**:
- Constitution (Stack): "Player de música: `<audio>` nativo do navegador + playlist em
  arquivo de dados. Sem SDK de streaming no cliente."
- A fonte padrão é **lançamentos**, na ordem do mais novo ao mais antigo (FR-080),
  conforme pedido da artista: o play começa pelo lançamento mais recente. A ordem usa
  a data de lançamento quando existir, senão o ano, com desempate estável por slug —
  assim a playlist nunca embaralha entre visitas.
- O volume, o modo aberto/compacto e a fonte escolhida ficam em `localStorage`
  (FR-077, FR-082, FR-083) — são preferências de visitante, não de conteúdo.

**Pontos de interpretação registrados**:
1. "por EP" e "por álbum" foram implementados como *escolher um lançamento específico*
   daquele tipo, e não como "tocar tudo do tipo". É a leitura útil para a visitante; se
   a artista quiser o outro sentido, é ajuste de uma linha no seletor.
2. "aleatória" embaralha a lista da fonte padrão (lançamentos mais novos primeiro) em
   vez de sortear de um acervo paralelo — mantém uma única fonte de verdade para as
   faixas do site.

---

## R11 — Testes

**Decisão**: **Vitest 5.1.0** com a API programática do Astro (`dev()` / `preview()`)
para exercitar rotas HTTP reais via `fetch`. Sem Playwright.

**Rationale**:
- Constitution (Princípio V) exige teste para: rotas de API, transformações de dados,
  ordenação por popularidade e métricas de performance. Vitest cobre os quatro.
- A API programática do Astro sobe o servidor em processo e devolve um `handle`, o que
  permite testar rotas de verdade (inclusive sessão, cookies e redirect) sem browser.
- Playwright adicionaria ~300 MB de dependência e tempo de execução para um site sem
  teste visual. Rejeitado por ora; a constitution exige review humano para identidade
  visual, o que cobre esse furo.

**Alternativas avaliadas**:
- *Playwright*: rejeitado (peso).
- *Testes só unitários, sem HTTP*: não cobre sessão, guardas de rota e cookies, que é
  onde está o risco real do backoffice; rejeitado.

---

## R12 — Quality gates

**Decisão**:
- `npm run lint` — ESLint 9 (flat config) + `eslint-plugin-astro`, sem regra de
  estilo (Prettier separado, sem conflito).
- `npm run typecheck` — `astro check` (@astrojs/check 0.9.12) + `tsc --noEmit`.
- `npm run test` — Vitest.
- `npm run build` — `astro build` + `scripts/check-budget.mjs`, que falha se a
  primeira visualização passar de 150 KB comprimidos ou o JS de 30 KB gzip.
- `npm run validate:content` — valida o acervo (schema, categoria, mídia existente)
  e falha o build apontando arquivo, linha e campo.

**Rationale**: a constitution lista exatamente esses quatro gates. O orçamento de peso
precisa ser verificado por ferramenta, não por convenção — "Métricas de page weight são
verificadas em CI e reportadas no PR".

---

## R13 — Deploy

**Decisão**: VPS Linux com systemd. Serviço `gizzabell-site`, `WorkingDirectory` =
raiz do projeto (necessário: o runtime lê `content/`, `files/` e `data/`), usuário sem
shell, porta interna 4321, reverse proxy (Caddy) com TLS. Deploy:
`git pull --rebase` → `npm ci` → `npm run build` → `systemctl restart`.

**Rationale**:
- Constitution (Deploy): "artefato de build estático + runtime Node na VPS, servido por
  reverse proxy"; processo documentado e repetível (FR-124).
- `WorkingDirectory` na raiz é exigência do desenho: o acervo e a mídia ficam ao lado
  do código, versionados, e o build não os copia.

---

## R14 — Banco de dados futuro

**Decisão**: quando o gatilho de FR-134 ocorrer, a nova implementação dos repositórios
usará **`node:sqlite`** (módulo nativo do Node, disponível desde 22.5), sem dependência
adicional. O comando `npm run migrate:db` lê `content/` e grava no banco.

**Rationale**:
- O `@astrojs/db` foi removido no Astro 7, mas o próprio Astro 7 documenta
  `node:sqlite` como alternativa recomendada para o adapter Node — ou seja, o caminho
  futuro não exige ORM nem driver nativo.
- Mantém a decisão "arquivo agora, banco depois" honesta: a porta está aberta e é
  gratuita.

---

## Dependências — resultado

**Runtime (5)**: `astro`, `@astrojs/node`, `yaml`, `marked`, `typescript` (dev-only na
verdade — ver abaixo).

**Desenvolvimento**: `typescript`, `@astrojs/check`, `vitest`, `eslint`,
`eslint-plugin-astro`, `prettier`, `prettier-plugin-astro`, `sharp` (só para o script
de preparo de assets).

**Zero** framework de UI no cliente, zero ORM, zero driver de banco, zero SDK de
streaming, zero serviço de terceiros no caminho crítico.
