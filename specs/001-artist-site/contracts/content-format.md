# Contrato — Formato dos arquivos de conteúdo

**Feature**: Site da Artista Independente — Gizza Bell
**Versão do formato**: 1

Este é o contrato entre a **artista** e o **site**. A artista escreve esses arquivos
(ou usa o backoffice, que os escreve por ela); o site os lê. Se o formato mudar, os
arquivos existentes param de funcionar — por isso o campo `formato: 1` existe em cada
arquivo e a validação é explícita no build.

Regras gerais:

- Todos os arquivos são **UTF-8**, com quebras de linha LF.
- Frontmatter em **YAML**, entre linhas `---`.
- Caminhos de mídia são **relativos a `files/`** (ex.: `pics/show-sampa/01.jpg`).
  A URL pública é `/files/` + caminho.
- Datas em **ISO `YYYY-MM-DD`**.
- Nenhum arquivo usa caminho absoluto ou nome de máquina.

---

## 1. Post — `content/<ano>/<mes>.md`

Um arquivo por ano/mês. Vários posts no mesmo arquivo, separados por uma linha `---`.

```markdown
---
formato: 1
nome: Show em São Paulo
data: 2026-11-14
categoria: show
pasta: show-sampa-2026
poster: pics/show-sampa-2026/capa.jpg
tags:
  - show
  - ao vivo
midias:
  - pics/show-sampa-2026/01.jpg
  - pics/show-sampa-2026/02.jpg
  - pics/show-sampa-2026/03.jpg
---

Show no **Casa Blue**. Set completo com a banda.

Depois do show, fotos do soundcheck.

---

---
formato: 1
nome: Sessão de estúdio
data: 2026-11-20
categoria: trabalhos
pasta: estudio-novembro
midias:
  - pics/estudio-novembro/01.jpg
---

Gravando as faixas do próximo EP.
```

### Campos

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `formato` | number | recomendado | deve ser `1`; se ausente, assume-se `1` com aviso |
| `nome` | string | sim | 1–160 caracteres; o nome que a artista dá ao post |
| `data` | string | sim | ISO `YYYY-MM-DD`; o ano/mês do caminho do arquivo deve bater |
| `categoria` | enum | sim | `feed` \| `show` \| `lancamento` \| `evento` \| `trabalhos` |
| `pasta` | string | sim | slug `^\d{2}-\d{2}-\d{4}-\d{2}-\d{2}-\d{2}(-[a-z0-9-]+)?$` — `dd-mm-aaa-hh-mm-ss` + slug do nome do post; `files/pics/<pasta>/` (ou `files/videos/<pasta>/`) deve existir |
| `midias` | string[] | sim | ≥1 item; caminhos relativos a `files/`; arquivos devem existir |
| `poster` | string | condicional | obrigatório se a única mídia for vídeo; ausente → aviso (FR-111) |
| `tags` | string[] | não | livres, usadas na busca |
| `privado` | boolean | não | só `true` em `content/privado/`; default `false` |

**Nome da pasta** (FR-012): o nome carrega a data e hora de cadastro do post no
formato `dd-mm-aaa-hh-mm-ss`, seguida do slug do nome do post — por exemplo
`14-11-2026-18-30-45-show-sampa`. Quem escreve o arquivo à mão pode usar qualquer
nome de pasta válido; o backoffice é quem gera o timestamp no momento do cadastro.

### Regras de derivação

- **Formato aparente**: 1 mídia de imagem → `foto`; 1 mídia de vídeo → `video`;
  2+ mídias de imagem → `carrossel`. Um vídeo não faz parte de carrossel.
- **Slug**: derivado de `nome` (sem acento, hífen, minúsculas); se colidir com outro
  post, sufixo `-2`, `-3`…
- **Ordem no feed**: por `data` decrescente; empate resolvido pelo slug (estável).
- **Na timeline**: só `show`, `lancamento`, `evento` e `trabalhos`.

### Erros (build falha, com arquivo, linha e campo)

| Situação | Mensagem |
|---|---|
| campo obrigatório ausente | `content/2026/11.md:12 — campo "nome" é obrigatório` |
| categoria inválida | `...:14 — categoria "concerto" inválida; use feed, show, lancamento, evento ou trabalhos` |
| data fora do mês do arquivo | `...:15 — data "2026-10-02" não pertence ao arquivo de 2026/11` |
| mídia inexistente | `...:18 — mídia não encontrada: pics/show-sampa-2026/09.jpg` |
| pasta inexistente | `...:16 — pasta não encontrada: files/pics/show-sampa-2026` |
| `formato` diferente de 1 | `...:3 — formato de arquivo 2 não suportado; migre para 1` |

### Avisos (build passa)

| Situação | Aviso |
|---|---|
| `poster` ausente em post de vídeo | `... — post de vídeo sem poster; será usado visual substituto` |
| pasta sem post correspondente | `pasta pics/orfa/ não tem post; será ignorada` |
| pasta fora do índice | `... — pasta não listada em content/index.md; vai ao final, em ordem alfabética` |

---

## 2. Post privado — `content/privado/<ano>/<mes>.md`

**Mesmo formato do post.** A pasta é `content/privado/`; o post **nunca** aparece em
página pública, timeline ou busca. Só a artista vê, no backoffice.

---

## 3. Índice de pastas — `content/index.md`

Define a ordem "por pasta" (FR-041).

```markdown
---
formato: 1
pastas:
  - show-sampa-2026
  - estudio-novembro
  - neon-lp
---
```

- A ordem da lista é a ordem exibida.
- Pasta listada que não existe → **build falha**.
- Pasta existente não listada → **aviso**; aparece ao final, em ordem alfabética.

---

## 4. Lançamento — `content/discografia/<slug>.md`

```markdown
---
formato: 1
nome: EP Neon
tipo: ep
ano: 2026
data: 2026-11-14
capa: pics/discografia/neon.jpg
links:
  - rotulo: Bandcamp
    url: https://bandcamp.com/artista/neon
faixas:
  - titulo: Lost
    audio: audio/neon/lost.mp3
    duracao: 3:42
  - titulo: Halo
    audio: audio/neon/halo.mp3
    duracao: 4:05
  - titulo: Sem áudio
    duracao: 2:10
---

Quatro faixas gravadas em uma madrugada.

## Letra — Lost

Letra em **Markdown**, com quebras de linha.

## Letra — Halo

Letra de outra faixa.
```

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `formato` | number | recomendado | `1` |
| `nome` | string | sim | título do lançamento |
| `tipo` | enum | sim | `album` \| `ep` \| `single` \| `compilacao` |
| `ano` | number | sim | 1900–2100 |
| `data` | string | não | ISO `YYYY-MM-DD`; data de lançamento — ordena o player do mais novo ao mais antigo e desempata o mesmo ano |
| `capa` | string | sim | mídia deve existir |
| `links` | object[] | não | `{ rotulo, url }`, url http(s) absoluta |
| `faixas` | object[] | não | vazio → lançamento sem faixas (FR-072) |
| `faixas[].titulo` | string | sim | |
| `faixas[].audio` | string | não | se ausente, a faixa não é tocável |
| `faixas[].duracao` | string | não | `m:ss` |
| `privado` | boolean | não | default `false` |

**Letras**: seção `## Letra — <título da faixa>`, casada pelo título exato. Faixa sem
seção de letra continua na tracklist com indicação de ausência (FR-071).

**Ordem de recência** (usada pela fonte padrão do player): `data` decrescente quando
existir, depois `ano` decrescente, depois `slug` crescente como desempate estável.

---

## 5. Evento da agenda — `content/agenda/<slug>.md`

Um arquivo por evento.

```markdown
---
formato: 1
titulo: Show na Casa Blue
data: 2026-12-05
local: Casa Blue
cidade: São Paulo
cartaz: pics/agenda/casa-blue-2026.jpg
divulgar_email: false
links:
  - rotulo: Ingressos
    url: https://ingressos.exemplo/casa-blue
---

Show de abertura com banda completa.
```

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `titulo` | string | sim | 1–160 caracteres |
| `data` | string | sim | ISO `YYYY-MM-DD` |
| `local` | string | não | |
| `cidade` | string | não | |
| `cartaz` | string | não | mídia deve existir; ausente → visual substituto |
| `divulgar_email` | boolean | não | default `false`; reservado para a mailing list futura |
| `links` | object[] | não | `{ rotulo, url }` http(s); abrem em nova aba |

**Slug**: derivado de `titulo` + `data` (`casa-blue-2026-12-05`), único.

---

## 6. Coleção do player — `content/colecoes/<slug>.md`

```markdown
---
formato: 1
nome: Favoritos
faixas:
  - neon/lost
  - neon/halo
---
```

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `nome` | string | sim | exibido no seletor de fonte do player |
| `faixas` | string[] | sim | `<slug-lançamento>/<slug-faixa>`; faixa inexistente → aviso |

---

## Compatibilidade

- `formato: 1` é a única versão suportada hoje. Um arquivo com `formato: 2` faz o
  build falhar com mensagem explícita — nunca é interpretado "por baixo dos panos".
- Campos novos podem ser adicionados ao formato 1 de forma retrocompatível (campo
  opcional). Mudar o significado de um campo existente exige `formato: 2`.
- Migração do acervo para banco (`npm run migrate:db`) lê estes mesmos arquivos, então
  o formato é o contrato também do futuro.
