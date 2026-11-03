# Gizza Bell — site da artista

Site da Gizza Bell, artista independente. Astro + Node, SSR em processo único,
hospedado em VPS própria.

- **Leveza**: primeira visualização em ~12 KB comprimidos (orçamento: 150 KB),
  zero JavaScript de framework no cliente.
- **Conteúdo em arquivo**: o acervo vive em `content/` e `files/`, versionado no git.
  Acessado só por repositórios, para poder virar banco depois sem reescrever o site.
- **Backoffice**: área restrita à artista, com login e senha únicos.

---

## Rodando localmente

```bash
npm ci
npm run seed:fixtures      # cria um acervo de exemplo (imagens WebP geradas)
npm run admin:create -- --usuario artista
npm run dev                # http://localhost:4321
```

O `admin:create` pede a senha no terminal. Para automação: `ADMIN_SENHA=... npm run admin:create -- --usuario artista`.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção + gate de orçamento de performance |
| `npm run preview` | Sobe o build (servidor Node real) |
| `npm run start` | Sobe o build já gerado (`dist/server/entry.mjs`) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `astro check` |
| `npm run test` | Vitest (50 testes) |
| `npm run validate:content` | Valida o acervo: schema, categoria, mídia, pasta |
| `npm run check-budget` | Mede a primeira visualização e o JS |
| `npm run seed:fixtures` | Acervo de exemplo |
| `npm run admin:create` | Cria a conta da artista |
| `npm run assets:prepare` | Converte imagens para WebP (só desenvolvimento) |
| `npm run migrate:db` | Migração futura do acervo para SQLite |

Os quatro quality gates (`lint`, `typecheck`, `test`, `build`) precisam passar antes
de qualquer deploy.

---

## Publicar um post

### Opção A — pelo backoffice (rápido)

1. `https://gizzabell.com/admin` → entrar com usuário e senha.
2. **Posts** → preencher nome, data, categoria, mídias e descrição → *Salvar*.
3. O site grava o arquivo, cria o commit no git e publica na hora (sem build).

O nome da pasta é gerado automaticamente: `dd-mm-aaa-hh-mm-ss-nome-do-post`.

### Opção B — direto no repositório

1. Copiar as mídias para `files/pics/<dd-mm-aaa-hh-mm-ss-nome>/`.
2. Acrescentar o post em `content/<ano>/<mes>.md`:

```markdown
---
formato: 1
nome: "Show na Casa Blue"
data: 2026-11-14
categoria: show
pasta: 14-11-2026-18-30-45-show-casa-blue
tags:
  - show
midias:
  - pics/14-11-2026-18-30-45-show-casa-blue/01.webp
  - pics/14-11-2026-18-30-45-show-casa-blue/02.webp
---

Primeira apresentação do set novo. **Casa Blue**, São Paulo.
```

3. `npm run validate:content` — o build falha se algo estiver errado.
4. Commit e push.

**Categorias** (uma por post):

| Categoria | Na home | Na timeline |
|---|---|---|
| `feed` | sim | **não** — conteúdo normal do dia a dia |
| `show` | sim | sim |
| `lancamento` | sim | sim |
| `evento` | sim | sim |
| `trabalhos` | sim | sim — categoria genérica (live, colaboração, estúdio) |

**Formato do post** é deduzido do conteúdo da pasta: uma imagem → foto; um vídeo →
vídeo; duas ou mais imagens → carrossel. Não há limite de mídias.

**Marcações privadas** ficam em `content/privado/<ano>/<mes>.md` e só aparecem no
backoffice — nunca em página pública nem na busca.

---

## Estrutura do acervo

```text
content/
├── index.md              ordem das pastas (usada na ordenação "por pasta")
├── <ano>/<mes>.md        posts
├── privado/<ano>/<mes>.md  posts privados
├── discografia/<slug>.md lançamentos, faixas e letras
├── agenda/<slug>.md      eventos da agenda (um arquivo por evento)
└── colecoes/<slug>.md    playlists nomeadas do player

files/
├── pics/<pasta>/         imagens, capas, cartazes, posters
├── videos/<pasta>/       vídeos
└── audio/<lancamento>/   faixas

data/                     estado de runtime — fora do git
├── counters.json         contadores de popularidade
├── sessions.json         sessões do backoffice
├── admin.json            conta da artista (hash da senha)
└── audit.jsonl           registro de alterações
```

### Formato dos lançamentos

```markdown
---
formato: 1
nome: "EP Neon"
tipo: ep          # album | ep | single | compilacao
ano: 2026
data: 2026-11-20  # opcional — ordena o player do mais novo ao mais antigo
capa: pics/discografia/neon.webp
faixas:
  - titulo: "Lost"
    audio: audio/neon/lost.mp3
    duracao: "3:42"
---

Descrição do lançamento.

## Letra — Lost

Letra em **Markdown**.
```

---

## Deploy na VPS

Requisitos: Node 24, um usuário de sistema sem shell, Caddy (ou nginx) para TLS.

```bash
# uma vez
sudo useradd --system --home /srv/gizzabell-site --shell /usr/sbin/nologin gizzabell
sudo -u gizzabell git clone <repo> /srv/gizzabell-site
cd /srv/gizzabell-site
sudo -u gizzabell npm ci
sudo -u gizzabell npm run build
sudo cp deploy/gizzabell-site.service /etc/systemd/system/
sudo cp deploy/Caddyfile /etc/caddy/
sudo systemctl enable --now gizzabell-site caddy
```

Deploy a partir de então:

```bash
cd /srv/gizzabell-site
sudo -u gizzabell git pull --rebase
sudo -u gizzabell npm ci
sudo -u gizzabell npm run build
sudo systemctl restart gizzabell-site
```

O `WorkingDirectory` do serviço é a raiz do projeto: é de lá que o runtime lê
`content/`, `files/` e `data/`.

Variáveis (`/srv/gizzabell-site/.env`):

```ini
SESSION_SECRET=<32+ caracteres aleatórios>
SITE_URL=https://gizzabell.com
PORT=4321
TZ=America/Sao_Paulo
```

**O acervo é o repositório git.** O backoffice cria commit localmente na VPS e
tenta enviar para o origin (push é best-effort: se falhar, nada se perde).

---

## Arquitetura em uma tela

```text
navegador
   │
   ▼
Caddy (TLS) ──► Node (Astro SSR, processo único)
                     │
                     ├── middleware: /files/** (Range, cache imutável) e guarda do /admin
                     ├── páginas: home, timeline, agenda, discografia, post, contato
                     ├── API: /api/search, /api/ordem, /api/click
                     ├── backoffice: /admin (login, posts, agenda, cliques)
                     │
                     └── repositórios  ──►  content/ + files/   (hoje)
                                        data/                 (estado)
                                        ▲
                                        └── node:sqlite       (quando o volume pedir)
```

O acesso a dados passa por interfaces de repositório (`src/lib/content/repository.ts`).
Trocar a implementação de arquivo por uma de banco não toca página, rota nem
componente — é o motivo de o acervo ainda ser em arquivo.

---

## Privacidade

- Nenhum identificador de visitante é gravado. O contador de popularidade é
  agregado, por post.
- O IP é usado só em memória, para o rate limit, e não é persistido.
- Sem cookie de rastreamento, sem fingerprinting, sem analytics de terceiros.
- A senha da artista nunca é gravada em texto puro — só o hash scrypt, em
  `data/admin.json` (fora do git).
