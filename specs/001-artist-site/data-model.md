# Phase 1 — Data Model

**Feature**: Site da Artista Independente — Gizza Bell
**Date**: 2026-11-02

Entidades do acervo, seus campos, validações e relações. Os formatos de arquivo
completos estão em [`contracts/content-format.md`](./contracts/content-format.md).

---

## Diagrama de relações

```text
Pasta (files/pics/<pasta>/) 1 ──── N  Mídia
     │  ▲
     │  └── N (campo `pasta` do post)
     │
   Post ──── 1 Categoria (enum de 5 valores)
     │
     ├── N PostAnterior/PostSeguinte (derivado por data)
     └── 1 Contador de Popularidade (acumulado)

Índice de Pastas ──── N Pastas (define a ordem "por pasta")

Lançamento ──── N Faixa ──── 0..1 Arquivo de Áudio
     └── 1 Mídia (capa)

Evento da Agenda ──── 0..1 Mídia (cartaz)
Coleção do Player ──── N Faixa (referência por <lançamento>/<faixa>)

Conta da Artista ──── N Sessão
                  └─── N Registro de Auditoria
```

---

## Post

**Onde**: `content/<ano>/<mes>.md` (público) e `content/privado/<ano>/<mes>.md`
(privado). Formato multi-documento: cada post é um bloco `---` + frontmatter + corpo.

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `nome` | string | sim | 1–160 caracteres, não vazio |
| `data` | string | sim | ISO `YYYY-MM-DD`; o mês do arquivo deve bater com a data |
| `categoria` | enum | sim | `feed` \| `show` \| `lancamento` \| `evento` \| `trabalhos` |
| `pasta` | string | sim | slug `^[a-z0-9-]+$`; a pasta `files/pics/<pasta>/` deve existir |
| `midias` | string[] | sim | ≥1 item; cada item é caminho relativo a `files/` |
| `poster` | string | condicional | obrigatório se a única mídia for vídeo; senão aviso |
| `privado` | boolean | não | padrão `false`; `true` só em `content/privado/` |
| `tags` | string[] | não | livres, para busca |
| corpo (Markdown) | string | sim | descrição do post; renderizada com HTML cru descartado |

**Derivados (nunca no arquivo)**:
- `slug` — do `nome`, normalizado (sem acento, hífen, minúsculas); garante unicidade
  com sufixo numérico se já existir
- `formato` — `foto` (1 mídia de imagem) \| `video` (1 mídia de vídeo) \|
  `carrossel` (2+ mídias de imagem)
- `url` — `/post/<slug>`
- `capa` — primeira mídia; para vídeo, o `poster`
- `dimensoes` — largura/altura lidas do cabeçalho do arquivo
- `excerpt` — resumo da descrição para listagens e busca

**Regras de negócio**:
- Categoria `feed` → aparece na home, **nunca** na timeline (FR-017).
- Categorias `show`, `lancamento`, `evento`, `trabalhos` → home **e** timeline (FR-018).
- `privado: true` → invisível em qualquer página pública e na busca (FR-020, FR-060).
- Pastas ausentes do índice → listadas ao final da ordenação "por pasta", em ordem
  alfabética, com aviso no build (FR-024).

---

## Pasta

**Onde**: `files/pics/<pasta>/`, `files/videos/<pasta>/`.

| Campo | Tipo | Validação |
|---|---|---|
| `pasta` (slug) | string | `^\d{2}-\d{2}-\d{4}-\d{2}-\d{2}-\d{2}(-[a-z0-9-]+)?$` — `dd-mm-aaa-hh-mm-ss` + slug do nome do post; único entre os posts |
| `cadastrado_em` | datetime | **derivado** do nome da pasta; o sistema o gera no momento do cadastro (FR-012) |
| mídia | arquivo | existe; extensão de imagem (`.webp`, `.jpg`, `.png`, `.avif`) ou vídeo (`.mp4`) |

**Regras**:
- Um post referencia uma pasta; a pasta contém as mídias do post.
- O timestamp usa o fuso horário configurado no servidor (`TZ` do serviço).
- Duas postagens criadas no mesmo segundo recebem sufixo numérico
  (`14-11-2026-18-30-45-show-sampa-2`), sem sobrescrever nada.
- Pastas sem post correspondente são ignoradas com aviso (edge case da spec).
- Pasta fora do padrão de nome é aceita com aviso, desde que o post aponte para ela.
- **A ordenação "por pasta" NÃO depende do nome da pasta** — vem de
  `content/index.md`. O prefixo `dd-mm-aaa` não ordena alfabeticamente de forma
  cronológica (o dia vem primeiro), e isso é irrelevante por construção.

---

## Categoria

Enum fechado, validado no load. Valor fora do conjunto → build falha (FR-023).

| Valor | Na home | Na timeline | Uso |
|---|---|---|---|
| `feed` | sim | **não** | conteúdo normal do dia a dia |
| `show` | sim | sim | show, apresentação, live |
| `lancamento` | sim | sim | lançamento de música ou álbum |
| `evento` | sim | sim | feira, workshop, partnering, sponsored |
| `trabalhos` | sim | sim | categoria genérica: qualquer obra que não caiba nas outras |

---

## Índice de Pastas

**Onde**: `content/index.md`. Define a ordem "por pasta" (FR-041).

| Campo | Tipo | Validação |
|---|---|---|
| `pastas` | string[] | slugs existentes; pasta inexistente → build falha (FR-023) |

Pastas não listadas → ao final, em ordem alfabética, com aviso (FR-024).

---

## Lançamento (discografia)

**Onde**: `content/discografia/<slug>.md`.

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `nome` | string | sim | título do lançamento |
| `tipo` | enum | sim | `album` \| `ep` \| `single` \| `compilacao` |
| `ano` | number | sim | 1900–2100 |
| `data` | string | não | ISO `YYYY-MM-DD`; data de lançamento, usada para ordenar do mais novo ao mais antigo e desempatar o mesmo ano |
| `capa` | string | sim | caminho relativo a `files/`; a mídia deve existir |
| `faixas` | object[] | não | lista ordenada; vazio → lançamento aparece sem faixas (FR-072) |
| `faixas[].titulo` | string | sim | |
| `faixas[].slug` | string | derivado | do título, único no lançamento |
| `faixas[].audio` | string | não | caminho relativo a `files/`; se ausente, a faixa não é tocável |
| `faixas[].duracao` | string | não | `m:ss` ou `h:mm:ss` |
| `links` | object[] | não | `{ rotulo, url }`; url absoluta http(s) |
| corpo | string | não | descrição do lançamento |
| seção `## Letra — <título>` | string | não | letra em Markdown, casada pelo título da faixa |

**Regras**:
- Faixa sem letra → continua na tracklist com indicação de ausência (FR-071).
- `privado: true` → lançamento e faixas invisíveis publicamente (FR-074).
- **Ordem de recência**: `data` (quando existir) decrescente, depois `ano` decrescente,
  depois `slug` crescente como desempate estável. É essa ordem que alimenta a fonte
  padrão do player (FR-080).

---

## Evento da Agenda

**Onde**: `content/agenda/<slug>.md` — um arquivo por evento, para que o backoffice
edite só o que mudou e o diff no git fique legível.

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| `titulo` | string | sim | 1–160 caracteres |
| `data` | string | sim | ISO `YYYY-MM-DD` |
| `local` | string | não | |
| `cidade` | string | não | |
| `descricao` | string | não | Markdown |
| `cartaz` | string | não | caminho relativo a `files/`; ausente → visual substituto (FR-064) |
| `links` | object[] | não | `{ rotulo, url }`; abrem em nova aba (FR-063) |
| `divulgar_email` | boolean | não | padrão `false`; reservado para a mailing list futura (FR-065) |
| `slug` | derivado | — | do título + data, único |

**Regras**: ordenação por data; eventos com data futura = futuros, data passada =
passados (FR-061). A lista alterna entre futuros e passados.

---

## Coleção do Player

**Onde**: `content/colecoes/<slug>.md`.

| Campo | Tipo | Validação |
|---|---|---|
| `nome` | string | nome exibido no seletor de fonte do player |
| `faixas` | string[] | referências `<slug-lançamento>/<slug-faixa>`; faixa inexistente → aviso |

Fontes do player (FR-079): **lançamentos** (padrão — todas as faixas, lançamentos do
mais novo ao mais antigo), **coleção** (esta entidade), **EP** (releases de tipo `ep`,
escolhendo um), **álbum** (releases de tipo `album`, escolhendo um) e **aleatória**
(todas as faixas da fonte padrão, embaralhadas sem repetir até percorrer a playlist).

---

## Contador de Popularidade

**Onde**: `data/counters.json` (fora do git).

| Campo | Tipo | Validação |
|---|---|---|
| `<slug-do-post>` | number | inteiro ≥ 0; entrada limitada a 10^9 por post |

Regras: sem identificador de visitante (FR-037); persistente entre reinícios (FR-038);
escrita atômica e agrupada.

---

## Conta da Artista

| Campo | Tipo | Notas |
|---|---|---|
| `usuario` | string | único |
| `hash` | string | `scrypt$<N>$<r$p>$<salt-b64>$<hash-b64>` |
| `bloqueado_ate` | ISO datetime \| null | lockout após 10 falhas (FR-095) |
| `ultima_falha` | ISO datetime | para a janela de lockout |

Existe **exatamente uma** conta, criada na instalação (`npm run admin:create`).

---

## Sessão

**Onde**: `data/sessions.json` (fora do git).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | token opaco de 32 bytes em base64url; vai no cookie |
| `criada_em` | ISO datetime | |
| `expira_em` | ISO datetime | 8 h |
| `usuario` | string | |

Cookie: `HttpOnly`, `SameSite=Strict`, `Path=/`, `Secure` em produção.

---

## Registro de Auditoria

**Onde**: `data/audit.jsonl` (uma linha JSON por evento, fora do git).

| Campo | Tipo | Notas |
|---|---|---|
| `em` | ISO datetime | |
| `usuario` | string | "artista" |
| `acao` | enum | `criar` \| `editar` \| `remover` \| `login` \| `logout` \| `login_falho` |
| `alvo` | string | tipo + slug do item |
| `detalhe` | object | campos alterados (antes/depois) |

---

## Repositório (interface interna)

Contrato interno que isola o armazenamento (FR-127). Uma interface por tipo de dado;
hoje há implementação em arquivo, amanhã haverá em `node:sqlite` (FR-128).

```ts
interface PostRepository {
  list(opts?: { incluirPrivados?: boolean }): Promise<Post[]>
  getBySlug(slug: string, opts?: { incluirPrivados?: boolean }): Promise<Post | null>
  orderByPasta(posts: Post[]): Promise<Post[]>          // usa o índice de pastas
}

interface AgendaRepository {
  list(): Promise<EventoAgenda[]>
  upsert(evento: EventoAgenda): Promise<EventoAgenda>
  remove(slug: string): Promise<void>
}

interface ReleaseRepository {
  list(): Promise<Lancamento[]>
  getBySlug(slug: string): Promise<Lancamento | null>
  upsert(lancamento: Lancamento): Promise<Lancamento>
  remove(slug: string): Promise<void>
}

interface CollectionRepository { list(): Promise<ColecaoPlayer[]> }

interface CounterStore {
  get(slug: string): Promise<number>
  increment(slug: string): Promise<number>
  ranking(): Promise<Array<{ slug: string; cliques: number }>>
}

interface SessionStore {
  create(usuario: string): Promise<Sessao>
  get(id: string): Promise<Sessao | null>
  destroy(id: string): Promise<void>
}

interface AuditStore { append(registro: RegistroAuditoria): Promise<void> }
```

Nenhuma página, rota ou componente importa `file-*.ts` diretamente — apenas
`repository.ts`. É essa restrição que torna a troca por banco um trabalho de um
arquivo.

---

## Estados e transições

**Post**: `rascunho` (só existe no backoffice, em `content/privado/`) → `publicado`
(`content/<ano>/<mes>.md`) → `privado` (volta para `content/privado/`) → removido
(arquivo deletado, commit registra).

**Sessão**: `ativa` → `expirada` (8 h) → destruída no logout.

**Conta**: `ativa` → `bloqueada` (10 falhas em janela de 15 min) → `ativa` (expira o
bloqueio).

**Publicação pelo backoffice** (sequência única, transacional no git):
1. valida o payload (schema)
2. escreve o arquivo em disco
3. invalida o cache por `mtime`
4. `git add` + `git commit`
5. tenta `git push` (best-effort, não bloqueia a resposta)
6. registra auditoria
