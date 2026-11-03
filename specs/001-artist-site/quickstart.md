# Quickstart — Validação do site

**Feature**: Site da Artista Independente — Gizza Bell
**Data**: 2026-11-02

Guia executável para provar, de ponta a ponta, que a implementação atende a spec.
Referência o plano e os contratos em vez de duplicar conteúdo.

> Esta fase é **documentação**. Os comandos abaixo só existem depois da
> implementação (ver `tasks.md`).

---

## Pré-requisitos

- Node.js 24 LTS (`node -v` → `v24.x`)
- `corepack` ou `npm` ≥ 11
- Git configurado (`user.name`, `user.email`)
- Para testar o backoffice: a conta da artista criada por `npm run admin:create`

---

## 1. Preparar o ambiente

```bash
npm ci
npm run admin:create -- --usuario artista
cp .env.example .env
```

`.env` mínimo:

```ini
SESSION_SECRET=<32+ caracteres aleatórios>
SITE_URL=http://localhost:4321
```

---

## 2. Acervo mínimo de teste

O repositório precisa de conteúdo para as páginas não saírem vazias. O acervo de
exemplo fica em `tests/fixtures/acervo/` e é copiado para `content/` e `files/` pelo
script de seed:

```bash
npm run seed:fixtures
```

Ele cria:

- `content/index.md` com a ordem das pastas
- `content/2026/11.md` com 3 posts (um `feed`, um `show`, um `trabalhos`), sendo um
  deles com 3 fotos (carrossel) e um com vídeo
- `content/discografia/ep-neon.md` com 2 faixas, uma com letra
- `content/agenda/casa-blue-2026-12-05.md`
- `content/colecoes/favoritos.md`
- `files/pics/...`, `files/videos/...`, `files/audio/...`

---

## 3. Quality gates

Os quatro gates da constitution, na ordem em que devem passar:

```bash
npm run lint          # ESLint — sem erros
npm run typecheck     # astro check + tsc --noEmit — sem erros
npm run test          # Vitest — suíte verde
npm run build         # astro build + check-budget — build limpo
```

**Falha esperada se o gate de conteúdo achar erro**:
`npm run validate:content` imprime arquivo, linha e campo, e sai com código 1.

---

## 4. Subir o site

```bash
npm run dev           # http://localhost:4321
```

Para simular produção:

```bash
npm run build
npm run preview       # servidor Node real, com o adapter
```

---

## 5. Cenários de validação

### 5.1 Home — mosaico e feed

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Abrir `/` | Mosaico com um tile por post; tiles mais clicados maiores |
| 2 | Conferir o HTML da resposta | `width`/`height` em toda `<img>`; nenhum `style` inline de tamanho |
| 3 | Clicar no alternador de visualização | Vira feed sem recarregar a página; URL não muda |
| 4 | Recarregar a página | Mantém o modo escolhido (mosaico → feed → mosaico) |
| 5 | Rolar o feed | Posts em ordem de data decrescente, vertical |
| 6 | Clicar num post de carrossel no feed | Slider navegável; indicador de "2 de 3" |
| 7 | Clicar num tile do mosaico | Abre `/post/<slug>` |

**Comando de apoio** (FR-025, FR-031, FR-034):

```bash
curl -s http://localhost:4321/ | grep -c '<img'         # uma imagem por post
curl -s http://localhost:4321/ | grep -o 'width="[0-9]*"' | head
```

### 5.2 Ordenações

Trocar a ordenação entre **data**, **pasta** e **popularidade** e conferir a sequência
dos slugs no HTML:

```bash
curl -s "http://localhost:4321/?ordem=pasta" | grep -o '/post/[a-z0-9-]*' | head -20
curl -s "http://localhost:4321/?ordem=popularidade" | grep -o '/post/[a-z0-9-]*' | head -20
```

A ordenação por pasta deve seguir a ordem de `content/index.md`; a ordenação por
popularidade deve colocar o post com mais cliques primeiro.

### 5.3 Busca

```bash
curl -s "http://localhost:4321/api/search?q=neon" | jq .
curl -s "http://localhost:4321/api/search?q=a"      # 400 termo_curto
```

Na home, digitar na busca deve filtrar **sem** requisição ao servidor (verificar na
aba Network do navegador).

### 5.4 Contador de popularidade

```bash
curl -s -X POST http://localhost:4321/api/click -H 'Content-Type: application/json' -d '{"post":"show-em-sao-paulo"}' -o /dev/null -w '%{http_code}\n'
cat data/counters.json
```

O contador deve ter subido em 1 e sobrevivido a um reinício do servidor (FR-038).

### 5.5 Timeline

```bash
curl -s http://localhost:4321/timeline | grep -o '/post/[a-z0-9-]*'
```

Devem aparecer **apenas** os posts de categoria `show`, `lancamento`, `evento` e
`trabalhos` — nunca os de categoria `feed`, nunca os privados (FR-057, FR-060).

### 5.6 Post privado

```bash
# logada: deve aparecer
curl -s -b cookies.txt http://localhost:4321/admin/posts | grep 'privado'
# sem sessão: não pode aparecer em página pública nem na busca
curl -s "http://localhost:4321/api/search?q=segredo" | jq '.total'   # 0
```

### 5.7 Backoffice — autenticação

```bash
curl -si http://localhost:4321/admin | head -5           # 303 → /admin/login
curl -si -X POST http://localhost:4321/admin/login -d 'usuario=artista&senha=errada' | head -5
# 303 → /admin/login?erro=credenciais
```

Após 10 falhas: `?erro=bloqueado` (FR-095). Verificar em `data/audit.jsonl`.

### 5.8 Backoffice — CRUD com efeito imediato

1. Logar no backoffice, criar um evento na agenda com data futura e cartaz.
2. Em até 5 segundos, `/agenda` mostra o evento (FR-066, SC-013).
3. `git log -1` mostra um commit novo com a autoria (FR-129).
4. Editar o post no backoffice → `/post/<slug>` reflete a mudança sem rebuild.
5. Remover o post → a página responde 404 amigável, sem link quebrado (FR-008).
6. Conferir o nome da pasta criada: `ls files/pics/` deve mostrar
   `dd-mm-aaa-hh-mm-ss-<slug-do-nome>` (FR-012); publicar dois posts em sequência e
   confirmar que os nomes não colidem.

### 5.9 Mídia e vídeo

```bash
curl -sI http://localhost:4321/files/pics/show-sampa-2026/01.jpg | grep -iE 'etag|cache-control|accept-ranges'
curl -sI -H 'Range: bytes=0-1023' http://localhost:4321/files/videos/show-sampa-2026/clip.mp4 | head -3
```

Esperado: `Cache-Control: public, max-age=31536000, immutable`, `Accept-Ranges: bytes`
e resposta `206` no pedido de range.

### 5.10 Desempenho e orçamento

```bash
npm run build
node scripts/check-budget.mjs --detalhe
```

Esperado: primeira visualização ≤ 150 KB comprimidos e JS ≤ 30 KB gzip. O gate falha o
build se estourar (SC-003).

### 5.11 Acessibilidade (verificação manual)

- Tab percorre: menu → lupa → alternância → ordenação → mosaico/feed → carrossel →
  player, com foco visível em todos (FR-117).
- Alvos de toque dos controles ≥ 44px (FR-118).
- Contraste AA em tema claro e escuro.
- A home continua legível com JavaScript desabilitado (FR-119): desativar JS e conferir
  que posts, timeline, agenda e discografia aparecem.

### 5.12 Player — fonte padrão e ordem

| # | Ação | Resultado esperado |
|---|---|---|
| 1 | Abrir `/` e acionar o play sem escolher fonte | Toca a faixa do lançamento mais recente (FR-080) |
| 2 | Conferir a sequência da playlist no painel do player | Lançamentos em ordem do mais novo ao mais antigo; faixas na ordem da tracklist |
| 3 | Trocar a fonte para "álbum" | A playlist passa a ser a do álbum escolhido; a fonte ativa aparece no player |
| 4 | Trocar a fonte para "aleatória" | A lista é embaralhada sem repetir a mesma faixa até percorrer tudo |
| 5 | Ajustar o volume, recarregar a página | O volume é o mesmo (FR-084) |
| 6 | Minimizar o player | Só o controle compacto com a faixa atual; o áudio continua (FR-086) |

**Comandos de apoio**:

```bash
# a faixa listada primeiro na playlist padrão é a do lançamento mais recente
curl -s http://localhost:4321/ | grep -o 'data-fonte="[a-z]*"' | head -1
```

Para conferir a ordem de recência direto no acervo:

```bash
npm run test -- tests/unit/release-order.test.ts
```

---

## 6. Migração para banco (validação do caminho futuro)

```bash
npm run migrate:db -- --destino .tmp/teste.db
npm run test:repos -- --impl db --db .tmp/teste.db
```

O mesmo conjunto de casos roda contra a implementação em arquivo e contra a de banco,
com o mesmo resultado (SC-018). Isso prova que a troca não toca páginas nem rotas.

---

## 7. Deploy na VPS

```bash
# na VPS, como usuário do serviço
cd /srv/gizzabell-site
git pull --rebase
npm ci
npm run build
sudo systemctl restart gizzabell-site
curl -sI http://127.0.0.1:4321/ | head -1
```

O `WorkingDirectory` do serviço systemd **tem** de ser a raiz do projeto: o runtime lê
`content/`, `files/` e `data/` a partir dali.

---

## Critério de pronto

A implementação está pronta quando:

1. Os quatro quality gates passam.
2. Todos os cenários de 5.1 a 5.11 passam.
3. `npm run test` cobre as rotas de API, as transformações de dados, a ordenação por
   popularidade e o cálculo das métricas de performance (Princípio V).
4. `/speckit.converge` reporta `Converged`.
