<!-- Sync Impact Report
Version change: 2.3.1 → 2.3.2 (PATCH)
Modified principles: IV. Conteúdo é Dado (nome da pasta carrega a data/hora de cadastro em dd-mm-aaa-hh-mm-ss)
Added rules: nenhuma
Removed rules: nenhuma
Impacto nas specs: specs/001-artist-site — FR-012 (nome da pasta), edge cases de colisão e de pasta fora do padrão, contrato de formato e task de geração do nome
Follow-up TODOs: none
-->

# Gizza Bell Constitution

## Core Principles

### I. Leveza é Requisito, não Preferência (NON-NEGOTIABLE)
O site existe para ser rápido e barato de hospedar. Nenhuma feature pode aumentar o bundle
entregue ao cliente sem justificativa em conjunto com o descarte de algo equivalente.

Regras:
- Orçamento de performance por página: HTML + CSS + JS + imagens do primeiro viewport
  ≤ 150 KB comprimidos; JS enviado ao cliente ≤ 30 KB gzip.
- Zero JavaScript de framework no cliente. Qualquer interação (lupa, player, mosaico,
  menu) precisa funcionar sem hydration de framework — apenas JS nativo islands mínimos.
- Imagens servidas em WebP/AVIF com `width`/`height` explícitos e `loading="lazy"`
  fora do viewport.
- Fontes locais ou system stack. Sem webfont de terceiros bloqueante.
- Qualquer dependência de runtime adicionada precisa justificar o custo em bytes ou
  tempo de build, e ser registrada na seção de Restrições.

Rationale: o público de uma artista independente acessa o site majoritariamente por
celular e link compartilhado; peso excessivo destrói a conversão e eleva o custo de
servidor da VPS.

### II. Simplicidade Operacional
O site roda em uma VPS própria com Node. Cada peça de infraestrutura é um custo
recorrente e um ponto de falha.

Regras:
- Uma única aplicação Node serve o site. Sem microsserviços, sem filas, sem cache
  distribuído, sem containers desnecessários.
- Sem banco de dados relacional. Persistência em arquivo/JSON/SQLite local é
  suficiente para o volume esperado.
- **Autenticação restrita ao backoffice**: exatamente uma conta, da artista, criada
  na instalação. Sem cadastro público, sem papéis ou equipes, sem recuperação de
  senha por e-mail, sem OAuth externo.
- **O backoffice é a única exceção controlada à regra de conteúdo versionado.** É o
  único lugar onde o site guarda estado mutável de conteúdo (eventos da agenda,
  postagens privadas, lançamentos, faixas, letras) e de contadores. O restante do
  acervo continua versionado em arquivos no repositório.
- Sem formulário de contato público, sem comentários de visitante, sem seção de
  membros.
- Sem serviço de terceiros em tempo de execução no caminho crítico de renderização.
  Embeds e integrações-optional são carregados sob demanda, com fallback.
- YAGNI: capacidade futura apenas é implementada quando uma spec ativa a exige.
  Mailing list e canal de comunidade (chatbot) ficam para specs futuras.

Rationale: a artista não deve precisar de um devops para publicar uma foto nova, nem
lidar com cadastro de usuários que ninguém pediu.

### III. Estética Cyberpunk como Linguagem de Produto
A identidade visual não é enfeite: é o produto. Cada tela nova deve parecer que
pertence ao mesmo site.

Regras:
- Design tokens (cor, tipografia, espaçamento, raio, sombra, glow) centralizados em
  um único arquivo de tokens; nenhuma cor ou espaçamento literal em componente.
- Tema claro e escuro devem existir e ser deriváveis dos mesmos tokens.
- Hierarquia visual consistente: topo com barra de navegação + lupa, corpo em mosaico
  ou listagem, base com player fixo. As três faixas nunca se quebram.
- O acervo tem duas leituras equivalentes, ambas obrigatórias: **mosaico** (grade,
  um item por post, com o tamanho de cada tile refletindo a popularidade) e **feed**
  (lista vertical rolando, post completo com carrossel). O alternador existe apenas
  na home e a escolha é memorizada.
- O mosaico ordenado por popularidade MUST manter o grid visualmente estável
  (posições e tamanhos determinísticos, resolvidos no servidor, sem salto de layout
  ao popular dados).
- Acessibilidade é parte da estética: contraste AA, foco visível, alvos de toque
  ≥ 44px, navegação por teclado.

Rationale: a artista vende a própria imagem; inconsistência visual quebra a marca.

### IV. Conteúdo é Dado, Código é Mecanismo
Conteúdo editorial (posts, coleções, agenda, timeline, playlist) vive em arquivos
versionados escritos pela artista, nunca hardcoded em templates.

Regras:
- Cada tipo de conteúdo tem um schema explícito e validado; item inválido falha no
  build, não em produção.
- Conteúdo é lido de um único lugar por tipo. Página e API nunca reinterpretam campos.
- Campos derivados (slug, datas, URLs de mídia, contadores) são calculados em um
  ponto único, não duplicados no front-end.
- O acervo é composto por **posts** nomeados pela artista. Cada post tem **sua própria
  pasta** (diretório) em `files/pics/`, que concentra suas mídias. Não há limite de
  quantidade de mídias por post, e não existe coleção que agrupe vários posts.
- O nome da pasta carrega a data e hora de cadastro do post no formato
  `dd-mm-aaa-hh-mm-ss`, seguida do slug do nome do post. O nome é gerado pelo sistema
  e nunca colide; a ordenação exibida não depende do nome da pasta, e sim do índice.
- Todo post tem uma **categoria** de um conjunto fechado (`feed`, `show`,
  `lancamento`, `evento`, `trabalhos`). `feed` é conteúdo normal, exclusivo da home;
  as demais também entram na timeline. `trabalhos` é a categoria genérica, para
  qualquer obra que não se encaixe nos rótulos específicos. A categoria é a única
  porta de entrada na timeline — não existe flag paralela, e o que diferencia um
  post do outro é o nome e a descrição.
- O formato aparente do post (foto única, vídeo ou carrossel) é deduzido do
  conteúdo da pasta, sem campo redundante no arquivo.
- Descrições dos posts ficam em Markdown, arquivadas por ano e mês
  (`content/<ano>/<mes>.md`); a ordem das pastas é definida por um índice escrito
  pela artista (`content/index.md`) e nunca é inferida do sistema de arquivos.
- Mídia (imagens, vídeos, áudio) fica em `files/` na raiz do repositório, organizada
  em subpastas por tipo (`files/pics`, `files/videos`, `files/audio`), publicada
  estaticamente sob a URL `/files/...`. Mídia nunca é embutida em código nem
  versionada como base64.
- Mídia é referenciada por caminho relativo dentro de `files/`, de modo que o
  repositório seja a única fonte de verdade do path e o deploy funcione em qualquer
  VPS sem reconfiguração.
- Publicar conteúdo novo não pode exigir mudança de código: adicionar arquivo em
  `files/` e entrada em `content/<ano>/<mes>.md` é suficiente.

Rationale: permite à artista publicar sozinha sem programador, e mantém a spec
verificável contra dados reais.

### V. Uma Mudança por Spec, Verificada por Evidência
Cada mudança começa por spec escrita e termina com evidência verificável.

Regras:
- Fluxo obrigatório: constitution → specify → plan → tasks → implement → converge.
- Nenhuma feature entra em produção sem critério de aceite testável na spec.
- Testes são exigidos para: rotas de API, transformações de dados, ordenação por
  popularidade, e cálculo de métricas de performance.
- Quality gates (lint, typecheck, build, testes) passam antes de commit/deploy.
- Código morto, feature flag sem dono e dependência não utilizada são dívida que
  bloqueia o merge.

Rationale: projeto pequeno e sem time exige que a verificação seja automatizada,
não lembrada.

### VI. Arquivo é a Fonte da Verdade; o Banco é uma Alternativa
Todo dado vive em arquivo, e o sistema é construído como se um banco fosse inserido
amanhã sem tocar no resto.

Regras:
- Todo dado tem um caminho de arquivo canônico:
  - `content/` — conteúdo editorial versionado: posts (`<ano>/<mes>.md`), ordem das
    pastas (`index.md`), discografia, agenda e postagens privadas.
  - `files/` — mídia: `pics/`, `videos/`, `audio/`.
  - `data/` — estado de runtime, fora do git: contadores de popularidade, sessões e
    registro de auditoria. Nunca entra no repositório.
- **Nenhuma página, rota, template ou componente lê o disco ou o banco
  diretamente.** Todo acesso passa por interfaces estáveis de repositório
  (post, agenda, lançamento, faixa, contador, sessão, auditoria).
- A implementação atual dessas interfaces é em arquivo. Trocar por SQLite ou outro
  banco significa escrever uma nova implementação da interface — proibido exigir
  mudança em página, rota ou no contrato entregue ao cliente.
- Conteúdo publicado pelo backoffice é gravado em arquivo e versionado em commit
  automático, com mensagem descritiva e autoria.
- Mudança de conteúdo passa a valer sem republicação manual: o site lê o conteúdo
  no momento da requisição e invalida cache por alteração de arquivo.- A migração para banco, quando ocorrer, é um comando único de leitura dos arquivos
  e escrita no banco, executado uma vez; o git continua sendo o backup do acervo.
- **A migração é adiada até o volume justificar.** Arquivo é a escolha certa enquanto o
  acervo é pequeno. O gatilho é observado, não calendarizado: leitura de conteúdo
  acima do orçamento de performance, histórico de commits que atrapalha a artist's
  gestão do acervo, ou consultas e filtros que o modelo em arquivo não atende
  bem (busca complexa, estatísticas, múltiplas ordenações). Nenhuma dessas
  condições é motivo para antecipar a migração.

Rationale: o acervo é pequeno e o git já é o versionamento, o histórico e o backup.
Isolar o acesso a dados mantém a porta aberta para banco sem custo agora e sem
retrabalho depois.

## 2. Restrições e Padrões

### Stack
- Runtime: Node.js LTS (versão fixa em `.nvmrc`), ESM.
- Build: Astro (renderização estática por padrão; server output apenas nas rotas que
  realmente precisam de runtime na VPS).
- Estilo: CSS puro com custom properties. Sem framework CSS, sem utility framework.
- Ícones: SVG inline ou sprite local. Sem biblioteca de ícones.
- Player de música: `<audio>` nativo do navegador + playlist em arquivo de dados.
  Sem SDK de streaming no cliente.

### Deploy
- Artefato de build estático + runtime Node na VPS, servido por reverse proxy.
- O diretório `files/` da raiz do repositório é servido como estático em `/files/`
  com cache longo e imutável (o conteúdo muda por versionamento, não por URL).
- O repositório git da VPS é a fonte do acervo: o backoffice grava arquivo e cria
  commit local. O deploy é `git pull` + build + restart, sem banco de dados para
  sincronizar.
- Processo de deploy documentado e repetível (`npm ci && npm run build` + restart
  do serviço). Sem pipeline de CI obrigatório para deploy; automação é opcional.
- Variáveis sensíveis (tokens de API, chaves) apenas por variável de ambiente,
  nunca em arquivo versionado.

### Performance
- Imagem de capa e conteúdo acima da dobra priorizados; demais imagens lazy.
- Vídeo nunca é baixado automaticamente: mosaic usa poster estático e carrega o
  arquivo de vídeo somente após interação explícita.
- Mídia nunca é servida sem `width`/`height` (ou `aspect-ratio`) definidos, para
  eliminar salto de layout.
- Chamadas de rede por página limitada: o player e a lupa não podem disparar
  requisições em cascata. Debounce na busca.
- Métricas de page weight são verificadas em CI e reportadas no PR.

### Segurança e Privacidade
- Coleta de dados de visitantes restrita ao mínimo: contador de cliques por item e
  nada mais. Sem identificadores de usuário, sem cookies de rastreamento, sem
  fingerprinting.
- Contadores são sanitizados e validados no servidor (entrada numérica limitada).
- Conteúdo estático servido com cache longo; respostas de API com cache curto.
- Senha da artista armazenada apenas como hash com algoritmo de derivação lento
  (scrypt/argon2) e sal por conta; nunca em texto puro, nunca no repositório como
  segredo versionado, nunca no cliente.
- Sessão por cookie HttpOnly + SameSite, com expiração, revogação ao encerrar sessão
  e rotação no login.
- Falha de login não revela existência de usuário; tentativas repetidas geram
  bloqueio temporário e são registradas.
- Toda rota do backoffice valida sessão no servidor. Nenhum segredo, hash, token ou
  dado de sessão é embutido no HTML ou no JavaScript entregue ao cliente.
- Toda alteração feita no backoffice é registrada com autor, data e conteúdo
  alterado.
- Upload pelo backoffice é validado por tipo, tamanho e nome de arquivo; o arquivo
  é gravado dentro de `files/` com nome derivado, sem permitir travessia de
  diretório.

## 3. Fluxo de Trabalho e Quality Gates

- Specs vivem em `specs/<id>-<slug>/` e são a fonte da verdade do escopo.
- Branches por feature; commits no estilo Conventional Commits.
- **Nenhuma implementação começa antes de a documentação básica estar concluída e
  a artista autorizar explicitamente.** Escrever spec, plano e tarefas é trabalho
  de documentação; escrever código é trabalho de implementação, e os dois não
  coexistem sem autorização explícita.
- Quality gates obrigatórios antes de merge:
  1. `npm run lint` — sem erros.
  2. `npm run typecheck` — sem erros.
  3. `npm run test` — suíte verde.
  4. `npm run build` — build limpo e sem warnings de bundle acima do orçamento.
- Mudança em token de design, em schema de conteúdo ou em rota de API exige
  atualização da spec correspondente.
- Review humano é obrigatório para: identidade visual, deploy em produção e
  qualquer alteração que afete o orçamento de performance.

## Governance

Esta constitution prevalece sobre qualquer prática informal, preferência de ferramenta ou
atalho adotado durante a implementação.

- **Emenda**: propose a alteração em `/speckit.constitution`, com justificativa,
  impacto nas specs existentes e plano de migração quando aplicável.
- **Versionamento**: MAJOR para remoção ou redefinição de princípio; MINOR para novo
  princípio ou expansão material de seção; PATCH para clarificação sem mudança de
  regra. A versão segue SemVer e vive no rodapé deste arquivo.
- **Compliance review**: toda review de PR e todo ciclo `/speckit.converge` verificam
  conformidade com esta constitution; violações são reportadas como bloqueantes.
- **Exceções**: permitidas apenas com registro explícito na spec que a origina e
  aprovação da artista.
- **Revisão periódica**: a constitution é revisada a cada milestone do site ou quando
  a stack mudar.

**Version**: 2.3.2 | **Ratified**: 2026-11-02 | **Last Amended**: 2026-11-02
