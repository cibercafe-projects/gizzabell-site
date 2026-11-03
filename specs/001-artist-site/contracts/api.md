# Contrato — API HTTP

**Feature**: Site da Artista Independente — Gizza Bell
**Base**: `/`

Convenções:

- JSON com `Content-Type: application/json; charset=utf-8`.
- Datas em ISO `YYYY-MM-DD` / ISO 8601 completo.
- Erros: `{ "erro": { "codigo": "...", "mensagem": "..." } }`, com `codigo` estável
  (constante, não texto livre) e mensagem em português.
- Ações de escrita exigem `X-Requested-With: gizzabell` (CSRF) e, no backoffice,
  cookie de sessão válido.
- Limite de vazão por IP: 60 requisições/minuto nas rotas públicas de escrita.

---

## Público

### `GET /api/search`

Busca global (lupa do topo). Cobre posts, eventos, lançamentos e faixas, incluindo a
letra das músicas (FR-048).

**Query**

| Parâmetro | Tipo | Padrão | Regras |
|---|---|---|---|
| `q` | string | — | obrigatório, ≥2 caracteres; sem acentos, case-insensitive |
| `limite` | number | 10 | 1–30 |
| `tipo` | string | — | opcional: `post` \| `evento` \| `lancamento` \| `faixa` |

**Resposta 200**

```json
{
  "termo": "neon",
  "total": 3,
  "resultados": [
    { "tipo": "post", "titulo": "Show em São Paulo", "resumo": "Show no **Casa Blue**…", "url": "/post/show-em-sao-paulo" },
    { "tipo": "lancamento", "titulo": "EP Neon", "resumo": "Quatro faixas gravadas…", "url": "/discografia/ep-neon" },
    { "tipo": "faixa", "titulo": "Lost — EP Neon", "resumo": "Letra de Lost…", "url": "/discografia/ep-neon#faixa-lost" }
  ]
}
```

**Resposta 200 (sem resultado)**: `{ "termo": "xyz", "total": 0, "resultados": [] }` —
estado vazio é resposta normal, nunca erro (FR-049).

**Erros**: `400` `{ "codigo": "termo_curto" }` quando `q` tem menos de 2 caracteres;
`429` `{ "codigo": "excesso_de_requisicoes" }`.

**Notas**: o cliente aplica debounce de 300 ms (FR-050). O servidor não guarda estado
entre requisições além do índice em memória, invalidado por `mtime`.

---

### `POST /api/click`

Registra um clique em um post (contador de popularidade).

**Corpo**: `{ "post": "<slug>" }`

**Resposta**: `204 No Content`. Sem corpo.

**Erros**: `400` `{ "codigo": "post_invalido" }` se o slug não for um post existente;
`429` `{ "codigo": "excesso_de_requisicoes" }`.

**Notas**: o cliente usa `navigator.sendBeacon` quando disponível. Nenhum identificador
de visitante é enviado ou armazenado (FR-037). O valor gravado é o contador
acumulado do post (FR-004).

---

### `GET /files/*`

Mídia (imagens, vídeos, áudio) servida a partir da pasta `files/` da raiz do
repositório.

**Resposta 200**: o arquivo, com `Content-Type` pelo tipo real, `ETag`,
`Last-Modified`, `Accept-Ranges: bytes` e
`Cache-Control: public, max-age=31536000, immutable`.

**Resposta 206**: parcial, quando há `Range` no pedido (necessário para `seek` de
vídeo e para o Safari reproduzir).

**Erros**: `404` se o arquivo não existir; `403` se o caminho tentar sair de `files/`
(travessia de diretório é bloqueada).

**Notas**: a mídia muda por versionamento, nunca por URL — por isso `immutable` é
seguro.

---

## Backoffice

Todas as rotas abaixo exigem sessão válida. Sem sessão: `303` para `/admin/login`.
Com sessão expirada: `303` para `/admin/login?expira=1`.

### `POST /admin/login`

**Corpo** (form-urlencoded): `usuario`, `senha`

**Resposta 303**: para `/admin` em sucesso, com o cookie de sessão definido
(`HttpOnly`, `SameSite=Strict`, `Secure` em produção, expiração de 8 h).

**Erros**: `303` para `/admin/login?erro=credenciais` (mensagem genérica — não revela
se o usuário existe, FR-094) ou `?erro=bloqueado` quando há lockout (FR-095).
Tentativas malsucedidas são registradas em auditoria.

**Rate limit**: 10 falhas em 15 min → bloqueio da conta por 15 min.

---

### `POST /admin/logout`

Encerra a sessão. **Resposta 303**: para `/admin/login`, cookie removido.

---

### `POST /admin/posts`

Cria ou atualiza um post (público ou privado).

**Corpo** (form ou JSON):

| Campo | Tipo | Regras |
|---|---|---|
| `slug` | string | vazio = criar; preenchido = atualizar |
| `nome` | string | obrigatório |
| `data` | string | ISO `YYYY-MM-DD` |
| `categoria` | enum | `feed` \| `show` \| `lancamento` \| `evento` \| `trabalhos` |
| `pasta` | string | slug; criada automaticamente se não existir |
| `midias` | string[] | caminhos relativos a `files/` |
| `poster` | string | opcional |
| `descricao` | string | Markdown |
| `tags` | string[] | opcional |
| `privado` | boolean | default `false` |

**Resposta 303**: para `/admin/posts?ok=1` em sucesso.

**Erros**: `400` com `{ "erro": { "codigo": "validacao", "campos": { "categoria": "valor inválido" } } }`.

**Efeito colateral**: grava o arquivo, invalida cache, cria commit no git e registra
auditoria (FR-129, FR-131).

---

### `POST /admin/posts/delete`

**Corpo**: `slug`. **Resposta 303**: para `/admin/posts?ok=1`. Remove o arquivo e
registra auditoria.

---

### `POST /admin/eventos`

Cria ou atualiza um evento da agenda. Campos: `slug`, `titulo`, `data`, `local`,
`cidade`, `descricao`, `cartaz`, `divulgar_email`, `links[]`.

**Resposta 303**: para `/admin/agenda?ok=1`.

---

### `POST /admin/eventos/delete`

**Corpo**: `slug`. **Resposta 303**: para `/admin/agenda?ok=1`.

---

### `POST /admin/lancamentos`

Cria ou atualiza um lançamento. Campos: `slug`, `nome`, `tipo`, `ano`, `capa`,
`faixas[]` (com `titulo`, `audio`, `duracao`, `letra`), `links[]`.

**Resposta 303**: para `/admin/discografia?ok=1`.

---

### `POST /admin/lancamentos/delete`

**Corpo**: `slug`. **Resposta 303**: para `/admin/discografia?ok=1`.

---

### `POST /admin/upload`

Envia um arquivo de mídia.

**Corpo**: multipart com `arquivo` e `destino` (`pics` | `videos` | `audio`).

**Resposta 200**:

```json
{ "caminho": "pics/show-sampa-2026/01.webp", "url": "/files/pics/show-sampa-2026/01.webp" }
```

**Regras**: tipo verificado por assinatura de arquivo (não só extensão); tamanho
máximo 50 MB para vídeo, 5 MB para imagem, 15 MB para áudio; nome gerado
(`slug` + índice), nunca o nome enviado pelo cliente; escrita sempre dentro de
`files/`; travessia de diretório bloqueada.

**Erros**: `400` `{ "codigo": "tipo_invalido" }`, `{ "codigo": "tamanho_excedido" }`,
`{ "codigo": "destino_invalido" }`.

---

### `GET /admin/estatisticas`

**Resposta 200**:

```json
{
  "total": 128,
  "posts": [
    { "slug": "show-em-sao-paulo", "nome": "Show em São Paulo", "cliques": 42, "posicao": 1 }
  ]
}
```

Ordenado por cliques decrescente, desempate por nome. Exige sessão (FR-103).

---

## Erros comuns

| Código | HTTP | Quando |
|---|---|---|
| `validacao` | 400 | campo inválido no payload |
| `termo_curto` | 400 | busca com menos de 2 caracteres |
| `post_invalido` | 400 | clique em slug inexistente |
| `nao_autorizado` | 303 | rota do backoffice sem sessão → redireciona ao login |
| `credenciais` | 303 | login inválido |
| `bloqueado` | 303 | login bloqueado por lockout |
| `tipo_invalido` | 400 | upload com tipo não permitido |
| `tamanho_excedido` | 400 | upload acima do limite |
| `excesso_de_requisicoes` | 429 | rate limit |

---

## Garantias de privacidade

- Nenhum identificador de visitante é enviado, lido ou gravado nas rotas públicas.
- O IP é usado **apenas** em memória, para o rate limit, e não é persistido.
- Nenhum segredo, hash de senha ou token de sessão aparece em resposta ao cliente
  (FR-106).
