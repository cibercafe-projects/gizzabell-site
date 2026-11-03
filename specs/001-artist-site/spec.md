?# Feature Specification: Site da Artista Independente — Gizza Bell

**Feature Branch**: `001-artist-site`

**Created**: 2026-11-02

**Status**: Draft

**Input**: User description: "Este projeto será em node.js é um site para uma artista independente. Tem que ser bem leve. Estética cyberpunk estilo Instagram na pagina inicial em mosaico do que tiver mais cliques para visualização e uma barra de menu com lupa paga pesquisa na parte superior e navegação para outras páginas, agenda, blog e timeline. Na barra inferior, um player de músicas." Hospedagem em VPS própria com Node; contato somente por e-mail/redes, sem formulário. Complementado por: "Os arquivos vão estar numa pasta /files dentro do projeto dividido por pics e videos"; "formatos, fotos avulsas e em carrossel. Como é nos posts do instagram. O site vai ter duas opções de visualização dos posts. Um mosaico e modo feed. Em ordem de data da postagem ou da pasta que eu inserir. Assim alimentando a timeline de eventos de uma página secundária. Os posts terão uma descrição básica que pode estar salvo em arquivo por ano e cada mês"; "no menu de navegação terá a pagina principal, com o feed/mosaico principal, no rodapé um player de música discreto que pode ser aberto e escolhido as músicas para tocar por coleção, ep ou album ou aleatório, com ajuste de volume. E pode ser minimizado, o segundo link do menu é a timeline de eventos principais, que serão lançamentos e shows e trabalhos. Uma tag na postagem vai informar o que aparece na timeline. O sistema terá uma página administrativa para postagens secreta com login e senha só da artista para postar os eventos. A terceira página será uma agenda de eventos. Que também terá uma página na area administrativa para cadastrar estes eventos de maneira simples será mostrado, data, título, descrição e um cartaz/folder de divulgação. Futuramente depois, faremos um cadastro de maiiling list para envio dos eventos da agenda por e-mail quando necessário e os fãs, se cadastrarem para receber por email ou outro canal como um chatbot da comunidade. A quarta página do menu será a discografia completa"; "não delimitar numero de fotos por post, vou dar nome a cada post então, tera um combo select [feed, show, lancamento, evento] onde o feed será excluido da timeline pois não é algo importante mas será conteúdos normais somente para o feed, já os outros precisam estar na timeline"; "A página principal terá todos os posts mostrando em feed [ordem de data] ou mosaico [mais clicados estarão maiores] e terá uma opção de visualização; Mas esta página principal a home terá todas as posts sempre e poderão ser pesquisados por palavras que contenham no titulo e descrição. No feed mostra como na visualização do instagram, a foto o titulo e a descrição, ou o video o titulo e a descrição, caso seja uma coleção de fotos, um carrossel slider para navegar as fotos e um titulo e a descrição do post. No mosaico, se clicar entra e visualiza o post unico igualmente. No feed, vai rolando para baixo ou para cima"; "Isso tudo pode ser salvo em arquivo as infos das postagens? Podendo ser adicionado a algum banco de dados futuramente?"; "Por enquanto manteremos em arquivos mas pra uma melhoria futura, quando tiver mais posts vamos colocar em um banco de dados"; "No player sempre tocar os lançamento mais recentes por ordem do mais novo ao mais antigo".

## Conceitos de conteúdo

**Área pública** — Home, Timeline, Agenda, Discografia, Post e Contato.

**Área administrativa (backoffice)** — acessível apenas com login e senha da artista:
login, painel, posts privados, eventos da agenda, discografia e faixas, estatísticas
de cliques.

O acervo é organizado em quatro níveis:

- **Post** — unidade nomeada pela artista. Cada post tem **sua própria pasta** (seu
  diretório), que guarda as mídias. Não há limite de quantidade de fotos ou vídeos
  por post.
- **Categoria** — todo post recebe uma categoria, escolhida num combo select com
  cinco valores: `feed`, `show`, `lancamento`, `evento`, `trabalhos`. `feed` é
  conteúdo normal, que vive só na home; `show`, `lancamento`, `evento` e
  `trabalhos` também entram na timeline. `trabalhos` é a categoria genérica, para
  tudo que é obra da artista mas não se encaixa nos rótulos específicos (lives,
  colaborações, registros de estúdio); o que distingue um post do outro é o seu
  nome e a sua descrição.
- **Descrição** — texto livre do post, em Markdown, arquivado em arquivos organizados
  por ano e mês.
- **Índice de pastas** — arquivo que define a ordem das pastas (dos posts) exibida
  quando a visitante escolhe a ordenação "por pasta".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explorar a home em mosaico (Priority: P1)

A visitante chega ao site pelo link compartilhado (Instagram, bio de rede social) e
precisa ver, de imediato, o acervo da artista num mosaico visual estilo feed. As
peças mais clicadas aparecem maiores, então o que é mais popular puxa o olhar. Ela
clica em um item e abre o post completo.

**Why this priority**: É a porta de entrada do site. Sem a home funcionando, nenhuma
outra feature tem valor — e é onde a artista concentra o esforço de divulgação.
Também é o requisito que dita toda a estética cyberpunk do produto.

**Independent Test**: Abrir a home em um viewport mobile e desktop, conferir que o
mosaico renderiza todos os posts com os mais clicados maiores e que o clique em um
item leva ao post correto.

**Acceptance Scenarios**:

1. **Given** um visitante novo em qualquer dispositivo, **When** a home carrega,
   **Then** o mosaico exibe todos os posts, com a capa de cada um, e sem salto de
   layout durante a carga.
2. **Given** posts com contagens de cliques diferentes, **When** o mosaico é
   exibido, **Then** os posts mais clicados ocupam tiles maiores e os menos clicados
   tiles menores.
3. **Given** um item de vídeo no mosaico, **When** a home carrega, **Then** a imagem
   de capa é exibida e nenhum arquivo de vídeo é baixado antes de a visitante
   interagir com o item.
4. **Given** a home carregada, **When** a visitante clica em um item do mosaico,
   **Then** ela abre o post correspondente e o contador de cliques daquele post é
   incrementado exatamente uma vez.
5. **Given** um item do mosaico, **When** a visitante navega por teclado,
   **Then** o item recebe foco visível, e Enter/ Espaço abrem o mesmo post que o
   clique do mouse.

---

### User Story 2 - Navegar pelas quatro páginas do menu (Priority: P1)

A visitante quer ir da home para a timeline, para a agenda e para a discografia. Ela
usa a barra de navegação fixa no topo, presente em todas as páginas, que também traz a
lupa de busca.

**Why this priority**: A estrutura de navegação é o esqueleto do produto. É o que
transforma a home em um site completo, e é barato de entregar.

**Independent Test**: A partir da home, acessar Timeline, Agenda e Discografia pela
barra de navegação e voltar à home.

**Acceptance Scenarios**:

1. **Given** qualquer página do site, **When** a visitante olha o topo, **Then** a
   barra de navegação fixa mostra a marca e os quatro links — Página principal,
   Timeline, Agenda, Discografia — e a lupa de busca, nessa ordem.
2. **Given** a visitante está na página de Agenda, **When** ela clica em "Discografia"
   na barra de navegação, **Then** chega à discografia completa, com a barra de
   navegação e o player presentes da mesma forma.
3. **Given** a largura do viewport é de celular, **When** a barra de navegação é
   exibida, **Then** todos os links permanecem acessíveis (menu compacto ou rolagem),
   sem corte e sem sobrepor o conteúdo.
4. **Given** a visitante está em qualquer página pública, **When** ela digita a URL do
   backoffice, **Then** ela é levada ao login, nunca ao painel.

---

### User Story 3 - Navegar pela home em modo feed (Priority: P1)

A visitante prefere rolar o acervo como no Instagram. No modo feed, a home mostra
todos os posts em ordem de data, um embaixo do outro, rolando para cima e para baixo.
Cada post aparece como a foto, o título e a descrição; ou o vídeo, o título e a
descrição; ou, quando o post tem várias fotos, um carrossel para navegar as fotos com
o título e a descrição.

**Why this priority**: É a forma principal de consumir o acervo e a referência visual
que a artista quer reproduzir.

**Independent Test**: Alternar para o modo feed e rolar a página, conferindo a ordem
por data e o formato de cada post.

**Acceptance Scenarios**:

1. **Given** a visitante na home em modo feed, **When** a página carrega, **Then** todos
   os posts aparecem em ordem de data, do mais recente para o mais antigo, e a
   rolagem é vertical.
2. **Given** um post com uma única foto, **When** ele aparece no feed, **Then** exibe a
   foto, o título e a descrição.
3. **Given** um post com vídeo, **When** ele aparece no feed, **Then** exibe o vídeo
   com controles, o título e a descrição.
4. **Given** um post com várias fotos, **When** ele aparece no feed, **Then** exibe um
   carrossel slider para navegar as fotos, com o título e a descrição do post.
5. **Given** um post no feed, **When** a visitante clica nele, **Then** ela abre o
   post completo.

---

### User Story 4 - Alternar entre feed e mosaico (Priority: P1)

A visitante alterna entre a leitura em feed e a leitura em mosaico com um controle na
home, e a preferência fica salva para as próximas visitas.

**Why this priority**: Os dois modos são as duas leituras pedidas para o acervo e
foram explicitamente alternáveis.

**Independent Test**: Na home, alternar mosaico → feed → mosaico e recarregar a
página, verificando que o modo escolhido persiste.

**Acceptance Scenarios**:

1. **Given** a visitante na home, **When** ela aciona o alternador de visualização,
   **Then** a home troca entre mosaico e feed, sem recarregar a página inteira.
2. **Given** a visitante escolheu o modo feed, **When** ela volta ao site em outra
   visita, **Then** a home já abre no modo feed.
3. **Given** a visitante nunca escolheu um modo, **When** ela abre a home,
   **Then** o modo mosaico é o padrão.

---

### User Story 5 - Ordenar o acervo por data, pasta ou popularidade (Priority: P2)

A visitante quer ver o acervo na ordem que faz sentido para ela: pelas datas em que
as peças foram publicadas, pelas pastas que a artista inseriu, ou pelo que o público
mais clicou.

**Why this priority**: Alternar a ordem de leitura dá controle sobre um acervo grande,
mas o padrão de cada modo já serve a maioria dos casos.

**Independent Test**: Na home, alternar a ordenação e conferir a sequência dos posts
em feed e em mosaico.

**Acceptance Scenarios**:

1. **Given** a home carregada em modo feed, **When** a visitante escolhe a ordenação
   "por data", **Then** os posts aparecem do mais recente para o mais antigo.
2. **Given** a home carregada, **When** a visitante escolhe a ordenação "por pasta",
   **Then** os posts aparecem na ordem das pastas definida pela artista no índice.
3. **Given** a home carregada em modo mosaico, **When** a visitante escolhe a
   ordenação "por popularidade", **Then** os posts aparecem do mais clicado para o
   menos clicado, com os mais clicados maiores.
4. **Given** a visitante trocou a ordenação, **When** ela recarrega a página,
   **Then** a ordenação escolhida é preservada.

---

### User Story 6 - Consultar a timeline de eventos principais (Priority: P2)

A visitante quer ver a linha do tempo da trajetória da artista — shows, lançamentos e
eventos — em uma lista única, do mais recente ao mais antigo. Só entram na timeline
os posts que a artista classificou como importantes.

**Why this priority**: É o que diferencia a timeline da home: mostra a história, não o
feed do dia a dia.

**Independent Test**: Abrir a timeline, percorrer as entradas na ordem esperada e
abrir o post correspondente.

**Acceptance Scenarios**:

1. **Given** a visitante na timeline, **When** a página carrega, **Then** aparecem
   apenas os posts de categoria `show`, `lancamento`, `evento` e `trabalhos`, em
   ordem cronológica inversa, com imagem, nome, data, resumo e o rótulo da
   categoria.
2. **Given** existem posts de categoria `feed`, **When** a visitante percorre a
   timeline, **Then** nenhum deles aparece.
3. **Given** uma entrada da timeline, **When** a visitante clica nela, **Then** ela
   abre o post correspondente.
4. **Given** a visitante na timeline, **When** ela percorre as entradas por teclado,
   **Then** todas são alcançáveis e abrem a mesma página que o clique do mouse.

---

### User Story 7 - Consultar a agenda de eventos (Priority: P2)

A visitante quer saber quando e onde a artista vai se apresentar. Ela abre a Agenda e
vê os próximos eventos com data, local e o cartaz de divulgação; os eventos passados
ficam disponíveis para consulta.

**Why this priority**: A agenda é o caminho de conversão para show, e é conteúdo que
a artista atualiza com frequência.

**Independent Test**: Abrir a agenda, ver o próximo evento com data, local e cartaz,
e acessar um evento já passado.

**Acceptance Scenarios**:

1. **Given** a visitante na agenda, **When** a página carrega, **Then** os eventos
   futuros aparecem em ordem de data, com título, data, local e cartaz de divulgação.
2. **Given** a visitante na agenda, **When** ela escolhe ver eventos passados,
   **Then** o histórico é exibido em ordem cronológica inversa.
3. **Given** um evento sem cartaz, **When** ele é exibido, **Then** um visual
   substituto é usado, sem quebrar o layout.
4. **Given** um evento com link de ingressos, **When** a visitante o aciona,
   **Then** ela sai do site para a plataforma de venda, em nova aba.

---

### User Story 8 - Consultar a discografia completa (Priority: P2)

A visitante quer conhecer a obra completa da artista: álbuns, EPs, singles e
compilações, com as faixas de cada lançamento e a letra de cada música.

**Why this priority**: A discografia é o acervo em forma de áudio e diferencia o site
de uma galeria de fotos.

**Independent Test**: Abrir a discografia, entrar em um lançamento e conferir a
tracklist com a letra de uma faixa.

**Acceptance Scenarios**:

1. **Given** a visitante na discografia, **When** a página carrega, **Then** todos os
   lançamentos aparecem, do mais recente para o mais antigo, com capa, tipo, ano e
   número de faixas.
2. **Given** a visitante entra em um lançamento, **When** a página carrega, **Then** ela
   vê a tracklist completa e a letra de cada faixa.
3. **Given** a visitante está na tracklist, **When** ela aciona uma faixa, **Then** a
   faixa é reproduzida no player do rodapé.
4. **Given** a visitante quer ler a letra sem sair da faixa, **When** ela expande a
   letra, **Then** a letra é exibida no lugar, de forma acessível por teclado.

---

### User Story 9 - Ouvir música pelo player do rodapé (Priority: P2)

A visitante quer ouvir a artista enquanto navega. No rodapé há um player discreto,
que pode ser aberto para escolha de faixas ou minimizado para liberar a tela. Ela pode
escolher o que toca por coleção, por EP, por álbum ou em ordem aleatória, e ajustar o
volume.

**Why this priority**: É o diferencial da experiência e o principal vetor de
retenção para uma artista, mas a home e a navegação já entregam valor sem ele.

**Independent Test**: Tocar uma faixa pelo player, mudar a fonte de reprodução para
um álbum, ajustar o volume, minimizar o player e navegar mantendo o áudio.

**Acceptance Scenarios**:

1. **Given** a visitante em qualquer página, **When** ela aciona o play no player do
   rodapé, **Then** a faixa começa a tocar e o player reflete o estado (tocando/
   pausado, título e arte da faixa).
2. **Given** o player está aberto, **When** a visitante escolhe a fonte de reprodução
   (lançamentos, coleção, EP, álbum ou aleatória), **Then** a playlist passa a ser a
   escolhida e o player mostra a fonte ativa.
3. **Given** a visitante nunca escolheu uma fonte, **When** ela aciona o play,
   **Then** toca a faixa do **lançamento mais recente**, seguindo para os lançamentos
   mais antigos, na ordem do mais novo ao mais antigo.
4. **Given** o player está aberto, **When** a visitante ajusta o volume, **Then** o
   volume muda de forma contínua e o valor é memorizado.
5. **Given** o player está aberto, **When** a visitante o minimiza, **Then** apenas o
   controle compacto com a faixa atual e o play/pausa permanece visível, e o áudio
   continua tocando.
6. **Given** uma faixa em reprodução, **When** a visitante navega para outra página,
   **Then** o áudio continua tocando e o player permanece disponível.

---

### User Story 10 - Pesquisar posts na home (Priority: P2)

A visitante quer achar um post pelo que lembra dele — uma palavra do título ou da
descrição. Ela digita na busca da home e os posts são filtrados enquanto ela digita.

**Why this priority**: A busca é o atalho para conteúdo específico dentro de um acervo
grande, e a home é onde ela está.

**Independent Test**: Digitar uma palavra presente em um título e em uma descrição, e
conferir que só os posts correspondentes ficam visíveis.

**Acceptance Scenarios**:

1. **Given** a visitante na home, **When** ela digita uma palavra presente no título
   ou na descrição de um post, **Then** apenas os posts correspondentes ficam
   visíveis, sem recarregar a página.
2. **Given** a visitante digita um termo sem correspondência, **When** o termo é
   confirmado, **Then** o site informa que nada foi encontrado e oferece uma ação de
   limpeza.
3. **Given** a visitante limpa a busca, **When** ela apaga o termo, **Then** todos os
   posts voltam a aparecer.
4. **Given** a visitante digita na busca da home, **When** ela pressiona Enter,
   **Then** o termo também é aberto na busca global da lupa.

---

### User Story 11 - Buscar em todo o site pela lupa (Priority: P3)

A visitante lembra do nome de uma faixa, da letra de uma música ou do tema de um post
e quer encontrá-lo sem navegar seção por seção. Ela toca na lupa no topo, digita e vê
resultados.

**Why this priority**: Alto valor para quem já conhece a artista; não é necessário
para a primeira impressão nem para a conversão imediata.

**Independent Test**: Abrir a busca global, digitar um termo existente e outro
inexistente, conferindo que os resultados correspondem e que o estado vazio é tratado.

**Acceptance Scenarios**:

1. **Given** a visitante abre a lupa, **When** digita um termo com correspondência,
   **Then** os resultados aparecem com título, tipo (post, evento, faixa, lançamento)
   e ação de abrir, e cada resultado é acessível por teclado.
2. **Given** a visitante digita um termo sem correspondência, **When** o termo é
   confirmado, **Then** o site informa que nada foi encontrado e oferece uma ação de
   limpeza, sem erro visível.
3. **Given** a visitante digita rapidamente, **When** cada tecla é pressionada,
   **Then** a busca não dispara uma requisição por tecla, apenas ao parar a digitação
   ou ao confirmar.

---

### User Story 12 - Entrar em contato (Priority: P3)

A visitante quer contratar ou falar com a artista. Ela procura o canal de contato e
encontra e-mail e redes sociais.

**Why this priority**: Existe o caminho mais simples possível (link de e-mail e redes)
e não há dependência técnica; entra no mesmo release do site.

**Independent Test**: A partir de qualquer página, abrir o contato e acionar o
e-mail/redes; verificar que o cliente de e-mail abre com o endereço preenchido.

**Acceptance Scenarios**:

1. **Given** a visitante em qualquer página, **When** ela procura o contato,
   **Then** encontra o endereço de e-mail e os links das redes sociais da artista.
2. **Given** a visitante aciona o link de e-mail, **When** o cliente de e-mail abre,
   **Then** o endereço de destino está preenchido e o assunto está legível.

---

### User Story 13 - A artista entrar no backoffice (Priority: P3)

A artista administra o site com login e senha exclusivos dela. Ninguém mais consegue
entrar.

**Why this priority**: Sem isso, nenhum dos fluxos administrativos existe; é
pré-requisito das stories seguintes.

**Independent Test**: Entrar com a credencial correta, ver o painel, sair; tentar
entrar com senha errada e ser bloqueado por tentativas repetidas.

**Acceptance Scenarios**:

1. **Given** a artista na tela de login, **When** ela informa usuário e senha
   corretos, **Then** é levada ao painel administrativo.
2. **Given** a artista na tela de login, **When** ela informa senha incorreta,
   **Then** a tela informa a falha sem revelar se o usuário existe, e a tentativa é
   registrada.
3. **Given** a artista logada, **When** ela sai, **Then** a sessão é encerrada e a URL
   protegida exige novo login.
4. **Given** alguém sem sessão, **When** acessa uma URL do backoffice, **Then** é
   levado à tela de login, sem revelar o conteúdo protegido.

---

### User Story 14 - Cadastrar um evento da agenda pelo backoffice (Priority: P3)

A artista recebe a data de um show e precisa publicá-lo. Ela entra no backoffice e
cadastra o evento com data, título, descrição e o cartaz/folder de divulgação, sem
programador.

**Why this priority**: É o que mantém a agenda atualizada, que é conteúdo de
conversão.

**Independent Test**: Cadastrar um evento, conferir que ele aparece na agenda pública
na posição correta e que o cartaz é exibido.

**Acceptance Scenarios**:

1. **Given** a artista no backoffice, **When** ela cadastra um evento com data,
   título, descrição e cartaz, **Then** o evento passa a aparecer na agenda pública
   na data informada.
2. **Given** a artista no backoffice, **When** ela edita um evento existente,
   **Then** a agenda pública passa a refletir a alteração.
3. **Given** a artista no backoffice, **When** ela remove um evento, **Then** ele
   deixa de aparecer na agenda pública.
4. **Given** a artista no backoffice, **When** ela cadastra um evento sem cartaz,
   **Then** o evento é publicado mesmo assim e a agenda usa um visual substituto.
5. **Given** a artista no backoffice, **When** ela marca o evento como "divulgar por
   e-mail", **Then** a marcação fica registrada no evento para uso futuro.

---

### User Story 15 - Publicar uma postagem (Priority: P3)

A artista monta uma postagem — nomeada por ela, com suas mídias, categoria e
descrição — e a publica. Posts marcados como secretos ficam visíveis apenas para ela.

**Why this priority**: É o fluxo de publicação que mantém o acervo vivo.

**Independent Test**: Publicar um post pelo backoffice, conferir que ele aparece na
home e, se a categoria permitir, na timeline.

**Acceptance Scenarios**:

1. **Given** a artista no backoffice, **When** ela publica um post com nome, categoria,
   mídias e descrição, **Then** o post passa a aparecer na home, na categoria escolhida
   e na timeline quando a categoria for `show`, `lancamento`, `evento` ou
   `trabalhos`.
2. **Given** a artista no backoffice, **When** ela escolhe a categoria `feed`,
   **Then** o post aparece na home e NÃO aparece na timeline.
3. **Given** a artista no backoffice, **When** ela escolhe a categoria `trabalhos`,
   **Then** o post aparece na home e na timeline, mesmo sendo um registro genérico
   (live, colaboração, sessão de estúdio), com o nome e a descrição como
   diferenciação.
4. **Given** a artista no backoffice, **When** ela marca o post como secreto,
   **Then** ele aparece apenas na área administrativa.
5. **Given** existe um post secreto, **When** uma visitante comum navega por todas
   as páginas públicas e busca, **Then** o post não aparece em nenhuma delas.
6. **Given** a artista no backoffice, **When** ela marca um post já publicado como
   secreto, **Then** o post desaparece das páginas públicas.

---

### User Story 16 - Acompanhar os cliques no backoffice (Priority: P3)

A artista quer saber quais peças do acervo mais atraem público, para saber o que
divulgar.

**Why this priority**: Dá retorno ao esforço de popularidade, mas não é exigido para
o site funcionar.

**Independent Test**: Clicar em um post como visitante, conferir que o contador
aparece atualizado no painel.

**Acceptance Scenarios**:

1. **Given** a artista no painel, **When** ela abre a seção de estatísticas,
   **Then** vê a lista de posts ordenados por número de cliques, com o total.
2. **Given** um post recebeu cliques, **When** a artista abre o detalhe da estatística,
   **Then** ela vê o total de cliques e a posição no ranking.
3. **Given** a artista está logada, **Then** o acesso a esses números exige login.

---

### User Story 17 - Gerenciar a discografia e as faixas (Priority: P3)

A artista lança um EP novo e precisa cadastrar o lançamento, as faixas, as capas, as
letras e os links, sem programador.

**Why this priority**: Mantém a discografia viva, mas pode ser iniciada com o acervo
já publicado em arquivos.

**Independent Test**: Cadastrar um lançamento com duas faixas e letra, conferir que
aparece na discografia pública e que as faixas são tocáveis no player.

**Acceptance Scenarios**:

1. **Given** a artista no backoffice, **When** ela cadastra um lançamento com tipo,
   ano, capa e faixas, **Then** o lançamento passa a aparecer na discografia pública.
2. **Given** a artista no backoffice, **When** ela preenche a letra de uma faixa,
   **Then** a letra aparece na página do lançamento.
3. **Given** a artista no backoffice, **When** ela liga um arquivo de áudio a uma
   faixa, **Then** a faixa é reproduzível no player.
4. **Given** a artista no backoffice, **When** ela remove um lançamento, **Then** ele
   deixa de aparecer na discografia pública.

---

### User Story 18 - Publicar um post sem mexer em código (Priority: P3)

A artista recebe uma foto nova (ou um conjunto para carrossel) e quer publicá-la. Ela
coloca os arquivos de mídia na pasta do post e escreve a descrição no arquivo do mês
correspondente, sem programador e sem tocar em código.

**Why this priority**: É o que garante que o site viva sozinho depois do lançamento,
mas só é testável com o acervo real.

**Independent Test**: Adicionar uma mídia na pasta do post, acrescentar a entrada no
arquivo do mês, rodar o build e ver o post na home e na timeline.

**Acceptance Scenarios**:

1. **Given** a artista adicionou uma foto na pasta do post e escreveu a entrada no
   arquivo do mês, **When** o site é construído, **Then** o novo post aparece na
   home, na ordenação escolhida e na busca, sem nenhuma alteração de código.
2. **Given** a artista escreveu uma entrada incompleta (sem nome, data, categoria,
   mídia ou descrição), **When** o site é construído, **Then** o build falha com uma
   mensagem apontando o arquivo, a linha e o campo faltante.
3. **Given** a artista quer publicar um carrossel, **When** ela lista várias mídias
   em uma única entrada, **Then** o post aparece no feed com o slider de fotos.

---

### Edge Cases

- **Mosaico sem popularidade ainda**: no primeiro dia, sem cliques registrados, a home
  precisa exibir todos os posts com ordenação estável e previsível, sem fileiras
  vazias nem erro.
- **Empate de popularidade**: posts com a mesma contagem de cliques precisam de uma
  regra de desempate determinística, para o mosaico não oscilar entre visitas.
- **Post sem pasta declarada**: o post é alocado em uma pasta padrão
  ("Sem pasta") e sinalizado no build, para nunca sumir do acervo.
- **Post sem nome**: o build falha — todo post precisa de um nome dado pela artista.
- **Post com categoria inválida**: o build falha, apontando o valor aceito mais
  próximo entre os cinco permitidos.
- **Pastas sem post correspondente**: a pasta é ignorada com aviso no build.
- **Duas postagens criadas no mesmo segundo**: o nome da pasta MUST ser único mesmo
  assim, com sufixo numérico; nenhuma pasta sobrescreve a outra.
- **Pastas criadas fora do padrão de nome**: uma pasta cujo nome não segue
  `dd-mm-aaa-hh-mm-ss-<slug>` é aceito com aviso, desde que o post aponte para ela.
- **Índice que não cita todas as pastas**: as pastas não citadas são listadas ao final
  da ordenação "por pasta", em ordem alfabética, com aviso no build.
- **Índice citando uma pasta inexistente**: o build falha indicando a pasta listada.
- **Post de categoria `feed` marcado por engano**: a artista muda a categoria no
  backoffice e o post passa a entrar ou sair da timeline imediatamente.
- **Faixa indisponível**: se um arquivo de áudio falhar ao carregar, o player deve
  exibir estado de erro e oferecer pular para a próxima faixa, sem travar a página.
- **Player minimizado durante a reprodução**: o estado compacto MUST continuar
  mostrando a faixa atual e o controle de play/pausa.
- **Player fechado com faixa em reprodução**: o áudio MUST continuar tocando e o
  acesso mínimo MUST permanecer disponível.
- **Busca com caractere especial ou vazio**: entrada vazia não dispara busca; entrada
  só com caracteres especiais é tratada como termo sem resultado, sem exceção.
- **Item removido do conteúdo mas ainda salvo como favorito/clicado**: links antigos
  para conteúdo removido devem responder de forma graciosa, sem tela de erro.
- **Contador hammering**: cliques repetidos em rajada no mesmo item não podem fazer o
  site contar a mesma visita infinitas vezes nem degradar a página.
- **Navegador sem JavaScript**: o conteúdo principal (home, agenda, discografia,
  timeline, páginas de detalhe) deve continuar legível; apenas as interações
  opcionais (busca ao vivo, contagem de cliques, alternância de modo, player)
  dependem de JS.
- **Conteúdo muito longo**: título, descrição e legenda precisam ser truncados sem
  quebrar o mosaico nem estourar o layout.
- **Mídia referenciada mas ausente**: um post cujo arquivo sumiu da pasta deve falhar
  no build, indicando o caminho, e nunca gerar link quebrado em produção.
- **Vídeo sem poster**: post de vídeo sem imagem de capa usa visual substituto e
  gera aviso no build, sem quebrar a home.
- **Vídeo pesado ou formato não suportado**: se o vídeo não reproduzir no navegador,
  o post continua visível no mosaico (com poster) e a página de detalhe informa a
  falha, mantendo o link para o arquivo original.
- **Download de vídeo interrompido**: a reprodução deve poder ser retomada ou
  reiniciada sem recarregar a página inteira.
- **Letra de música ausente**: a faixa aparece na tracklist sem letra, com indicação
  clara, sem quebrar a página do lançamento.
- **Lançamento sem faixas**: o lançamento é listado com indicação de "sem faixas
  disponíveis" e não abre página vazia.
- **Login com sessão expirada**: uma requisição autenticada expirada leva ao login
  com aviso, sem tela de erro.
- **Tentativas repetidas de login**: excesso de tentativas bloqueia o acesso por
  um período e é sinalizado no painel.
- **Evento da agenda com título duplicado**: são eventos distintos e ambos aparecem.
- **Ranking mudando durante a sessão**: cliques dados na sessão atual só alteram a
  ordem e o tamanho dos tiles na próxima carga da página.

## Requirements *(mandatory)*

### Estrutura e navegação

- **FR-001**: O site MUST incluir uma barra de navegação fixa no topo, presente em
  todas as páginas públicas, com a marca, a lupa de busca e exatamente quatro links
  nesta ordem: Página principal, Timeline, Agenda, Discografia.
- **FR-002**: O site MUST incluir um player de música fixo no rodapé, presente em
  todas as páginas públicas, em estado compacto por padrão.
- **FR-003**: O player MUST continuar reproduzindo durante a navegação entre páginas.
- **FR-004**: O ranking de popularidade MUST considerar o total de cliques acumulados
  desde a publicação do site, sem janela temporal (contador cumulativo por post).
- **FR-005**: O site MUST conter um conjunto de páginas públicas: Home, Timeline,
  Agenda, Discografia, Post e Contato.
- **FR-006**: A agenda MUST exibir seus itens em ordem cronológica, com destaque para
  eventos futuros.
- **FR-007**: A página de post MUST exibir o post completo, todas as suas mídias em
  carrossel, o nome, a descrição, a data e a categoria.
- **FR-008**: Todo link interno MUST levar a uma página existente; conteúdo removido
  MUST resultar em página de "não encontrado" com navegação de volta à home.
- **FR-009**: A área administrativa MUST ficar em caminho próprio, não listado na
  navegação pública, e MUST exigir autenticação em todas as suas páginas.

### Formatos e conteúdo dos posts

- **FR-010**: O acervo MUST ser composto por **posts**, cada um nomeado pela artista e
  com mídias próprias.
- **FR-011**: Cada post MUST ter **sua própria pasta** (diretório) em `files/pics/`,
  que concentra as mídias daquele post.
- **FR-012**: O nome da pasta MUST começar com a data e hora de cadastro do post, no
  formato `dd-mm-aaa-hh-mm-ss`, seguido do nome do post em slug — por exemplo
  `14-11-2026-18-30-45-show-sampa`. O timestamp MUST ser gerado pelo sistema no
  momento do cadastro, e MUST garantir unicidade da pasta mesmo com duas postagens
  criadas no mesmo segundo.
- **FR-013**: O número de mídias por post MUST NOT ter limite; um post pode ter uma
  única foto, um conjunto grande de fotos, um vídeo ou qualquer combinação.
- **FR-014**: O post MUST se apresentar como **foto única**, **vídeo** ou **carrossel**
  conforme o conteúdo da sua pasta, sem campo redundante para declarar o formato.
- **FR-015**: Cada post MUST ter, no mínimo, nome, data, categoria, pasta e lista de
  mídias.
- **FR-016**: Cada post MUST ter uma **categoria** escolhida num combo select com
  exatamente cinco valores: `feed`, `show`, `lancamento`, `evento`, `trabalhos`.
- **FR-017**: Posts de categoria `feed` MUST ser conteúdo normal, aparecer na home e
  MUST NOT aparecer na timeline.
- **FR-018**: Posts de categoria `show`, `lancamento`, `evento` e `trabalhos` MUST
  aparecer na home e MUST aparecer na timeline.
- **FR-019**: A categoria `trabalhos` MUST ser a categoria genérica, servindo a
  qualquer obra da artista que não se encaixe nos rótulos específicos (live,
  colaboração, sessão de estúdio, registro de processo); MUST NOT exigir informação
  adicional além do nome e da descrição do post.
- **FR-020**: Um post MUST poder ser marcado como **privado**, condição que o
  esconde de todas as páginas e buscas públicas.
- **FR-021**: O conteúdo MUST ser definido em arquivos Markdown versionados:
  descrições em `content/<ano>/<mes>.md` e índice de pastas em `content/index.md`.
- **FR-022**: O build MUST falhar, com arquivo, linha e campo, quando uma entrada de
  post estiver incompleta (sem nome, data, categoria, pasta, mídia ou descrição).
- **FR-023**: O build MUST falhar quando a categoria for diferente dos cinco valores
  aceitos, e MUST falhar quando o índice citar uma pasta que não existe.
- **FR-024**: Pastas e posts fora do índice MUST ser exibidos ao final da ordenação
  "por pasta", em ordem alfabética, com aviso no build.
- **FR-025**: O site MUST suportar acentos, emojis e formatação básica
  (negrito, itálico, links) nas descrições e letras, renderizadas com segurança.

### Home: feed e mosaico

- **FR-026**: A home MUST apresentar **todos** os posts, sempre, sem paginação que
  esconda conteúdo e sem filtro obrigatório.
- **FR-027**: A home MUST oferecer dois modos de visualização: **feed** e **mosaico**,
  alternáveis pela visitante, com o alternador presente apenas na home.
- **FR-028**: O modo mosaico MUST ser o padrão quando a visitante nunca escolheu um
  modo, e a escolha MUST ser preservada entre visitas.
- **FR-029**: A troca de modo MUST ocorrer sem recarregar a página inteira e sem
  perder a posição de rolagem.
- **FR-030**: O modo feed MUST apresentar os posts em lista vertical, rolagem para
  cima e para baixo, no estilo de rede social.
- **FR-031**: O modo feed MUST apresentar, para cada post, a mídia, o nome e a
  descrição; post com várias fotos MUST apresentar um carrossel slider para navegar
  as fotos; post com vídeo MUST apresentar o vídeo com controles.
- **FR-032**: O modo mosaico MUST apresentar um item por post, com a primeira mídia
  como capa (poster, no caso de vídeo), em grade de proporções variáveis.
- **FR-033**: No mosaico, o tamanho de cada item MUST refletir a popularidade: os
  posts mais clicados MUST ocupar tiles maiores, os menos clicados tiles menores.
- **FR-034**: A escala de tamanho MUST ser discreta e determinística, calculada a
  partir da posição no ranking, de modo que a grade permaneça estável e previsível.
- **FR-035**: A ordem e os tamanhos dos itens MUST ser resolvidos no servidor antes
  da renderização; o mosaico MUST NOT se reordenar ou redimensionar após a carga da
  página.
- **FR-036**: O clique em um item do mosaico MUST registrar exatamente um incremento
  no contador de popularidade daquele post e abrir o post.
- **FR-037**: No feed, o clique em um post MUST abrir o post completo e registrar o
  incremento de popularidade.
- **FR-038**: O sistema MUST registrar popularidade de forma agregada, sem identificar
  nem persistir dados pessoais da visitante.
- **FR-039**: O sistema MUST persistir os contadores de popularidade entre
  reinicializações do servidor.
- **FR-040**: A home MUST oferecer ordenação por **data**, por **pasta** e por
  **popularidade**, com os padrões: mosaico = popularidade, feed = data; a ordenação
  escolhida MUST ser preservada entre visitas.
- **FR-041**: A ordenação "por data" MUST ordenar do mais recente para o mais antigo.
- **FR-042**: A ordenação "por pasta" MUST ordenar pela ordem definida pela artista
  no índice de pastas.
- **FR-043**: A ordenação "por popularidade" MUST ordenar do mais clicado para o
  menos clicado.
- **FR-044**: A ordenação MUST alterar a sequência dos posts sem alterar o critério
  de tamanho dos tiles do mosaico, mantendo a grade visualmente estável.

### Busca

- **FR-045**: A home MUST ter um campo de busca que filtra os posts por palavras
  presentes no **nome** ou na **descrição**, sem diferenciar maiúsculas de
  minúsculas e sem diferenciar acentos.
- **FR-046**: A busca da home MUST filtrar sem nova requisição ao servidor e MUST
  informar quando nenhum post corresponde.
- **FR-047**: A busca da home MUST permitir limpar o termo e restaurar todos os
  posts.
- **FR-048**: A lupa da barra superior MUST buscar simultaneamente em posts,
  eventos, lançamentos e faixas.
- **FR-049**: A busca global MUST filtrar por título, nome, descrição, resumo, letra
  e tags, sem diferenciar maiúsculas de minúsculas e sem diferenciar acentos.
- **FR-050**: A busca global MUST retornar resultados com título, tipo e ação de
  abrir, e MUST tratar termo sem resultado informando o estado vazio.
- **FR-051**: A busca global MUST NOT disparar requisição a cada tecla; deve aguardar
  a interrupção da digitação ou a confirmação do usuário.
- **FR-052**: A busca global MUST funcionar com teclado e MUST permitir navegar pelos
  resultados e abrir um resultado.
- **FR-053**: A busca global MUST NOT revelar posts privados nem itens privados de
  releases.
- **FR-054**: A busca da home MUST permitir abrir o termo na busca global.

### Timeline

- **FR-055**: O site MUST ter uma página de timeline que exibe apenas os posts de
  categoria `show`, `lancamento`, `evento` e `trabalhos`.
- **FR-056**: A timeline MUST ser uma lista única, em ordem cronológica inversa (do
  mais recente ao mais antigo).
- **FR-057**: Cada entrada da timeline MUST exibir a capa, o nome, a data, o rótulo
  da categoria e um resumo da descrição, porque o nome e a descrição são o que
  diferencia um post do outro.
- **FR-058**: Posts de categoria `feed` MUST NOT aparecer na timeline.
- **FR-059**: O clique em uma entrada da timeline MUST abrir o post correspondente.
- **FR-060**: Postagens privadas MUST NOT aparecer na timeline, mesmo quando
  classificadas como `show`, `lancamento`, `evento` ou `trabalhos`.

### Agenda de eventos

- **FR-061**: O site MUST ter uma página de agenda listando os eventos cadastrados,
  com título, data, descrição e cartaz/folder de divulgação.
- **FR-062**: A agenda MUST separar visualmente eventos futuros e eventos passados,
  e MUST permitir alternar entre as duas listas.
- **FR-063**: Eventos MUST ser ordenados por data, e MUST continuar ordenados por
  data quando um evento for editado.
- **FR-064**: Um evento MUST poder ter links externos (ingressos, plataformas), que
  abrem em nova aba.
- **FR-065**: Evento sem cartaz MUST usar visual substituto, sem quebrar o layout.
- **FR-066**: Um evento MUST poder ser marcado como "divulgar por e-mail", para uso
  futuro, mesmo sem mailing list nesta fase.
- **FR-067**: A agenda pública MUST refletir em até 5 segundos as alterações feitas no
  backoffice, sem necessidade de republicação manual.

### Discografia

- **FR-068**: O site MUST ter uma página de discografia listando todos os lançamentos,
  do mais recente para o mais antigo, com capa, tipo, ano e número de faixas.
- **FR-069**: Os tipos de lançamento MUST ser, no mínimo: álbum, EP, single e
  compilação.
- **FR-070**: Cada lançamento MUST ter uma página própria com a tracklist completa.
- **FR-071**: Cada faixa MUST poder exibir a letra da música, de forma expansível e
  acessível por teclado.
- **FR-072**: Faixa sem letra MUST continuar aparecendo na tracklist, com indicação
  clara de ausência.
- **FR-073**: Lançamento sem faixas MUST ser listado com indicação de indisponibilidade,
  sem gerar página vazia.
- **FR-074**: Cada faixa MUST poder ser reproduzida no player do rodapé a partir da
  tracklist.
- **FR-075**: A discografia MUST NOT exibir faixas ou lançamentos marcados como
  privados.

### Player de música

- **FR-076**: O player MUST estar no rodapé em estado compacto por padrão, mostrando a
  faixa atual e o controle de play/pausa.
- **FR-077**: O player MUST poder ser aberto para a lista completa de controles e
  minimizado de volta ao estado compacto.
- **FR-078**: O estado aberto/compacto MUST ser memorizado entre visitas.
- **FR-079**: O player MUST oferecer cinco fontes de reprodução: **lançamentos**
  (padrão), por **coleção**, por **EP**, por **álbum** e **aleatória**.
- **FR-080**: A fonte padrão "lançamentos" MUST ser composta por todas as faixas de
  todos os lançamentos, com os lançamentos ordenados do **mais recente ao mais
  antigo** — o lançamento mais novo primeiro — e, dentro de cada lançamento, as faixas
  na ordem da tracklist.
- **FR-081**: Cada lançamento MUST poder ter uma data de lançamento (ISO
  `YYYY-MM-DD`), usada para ordenar os lançamentos do mais recente ao mais antigo e
  desempatar lançamentos do mesmo ano.
- **FR-082**: A fonte escolhida MUST ser exibida no player e a playlist MUST mudar
  para a fonte escolhida.
- **FR-083**: O player MUST permitir play, pausa, faixa anterior, faixa próxima e
  ajuste de volume.
- **FR-084**: O volume MUST ser memorizado entre visitas.
- **FR-085**: O player MUST indicar claramente a faixa em reprodução e o estado de
  reprodução.
- **FR-086**: O player MUST NOT iniciar reprodução automática sem interação explícita
  da visitante.
- **FR-087**: Falha ao carregar um arquivo de áudio MUST ser exibida no player com
  opção de pular para a próxima faixa, sem interromper o uso do restante da página.
- **FR-088**: A fonte "aleatória" MUST sortear as faixas sem repetir a mesma faixa
  até percorrer toda a playlist.

### Contato

- **FR-089**: O site MUST oferecer o contato por e-mail e por links de redes
  sociais, sem formulário de contato.
- **FR-090**: O link de e-mail MUST abrir o cliente de e-mail com o endereço da
  artista preenchido.
- **FR-091**: O site MUST NOT coletar cadastro de visitante, cookie de rastreamento ou
  identificador de visitante.

### Área administrativa e autenticação

- **FR-092**: O backoffice MUST ter login com usuário e senha exclusivos da artista,
  sem cadastro público de contas.
- **FR-093**: A senha MUST ser armazenada apenas como hash no servidor, nunca em
  texto puro no repositório nem no cliente.
- **FR-094**: A sessão MUST ser mantida por cookie HttpOnly, com proteção contra
  envio em requisições de terceiros, e MUST expirar.
- **FR-095**: Falhas de login MUST NOT revelar se o usuário existe, e MUST ser
  registradas com data e origem.
- **FR-096**: Tentativas repetidas de login MUST bloquear o acesso por um período
  definido e MUST ser sinalizadas no painel.
- **FR-097**: Toda rota do backoffice MUST exigir sessão válida; acesso sem sessão
  MUST redirecionar para o login sem revelar conteúdo protegido.
- **FR-098**: O backoffice MUST oferecer um painel com visão geral do acervo,
  da agenda e dos cliques.
- **FR-099**: O backoffice MUST permitir cadastrar, editar e remover **eventos da
  agenda** com data, título, descrição e cartaz/folder de divulgação.
- **FR-100**: O upload de cartaz pelo backoffice MUST armazenar o arquivo em
  `files/pics` e referenciá-lo pelo caminho relativo, sem quebrar a convenção
  existente.
- **FR-101**: O backoffice MUST permitir criar, editar, classificar e remover
  **postagens**, com nome, mídias, categoria, descrição e marcação de privado.
- **FR-102**: O combo select de categoria MUST oferecer exatamente `feed`, `show`,
  `lancamento`, `evento` e `trabalhos`, com `feed` como valor inicial de um post
  novo.
- **FR-103**: O backoffice MUST permitir listar e editar **lançamentos, faixas e
  letras**, incluindo o vínculo do arquivo de áudio com a faixa.
- **FR-104**: O backoffice MUST exibir **estatísticas de cliques** por post, ordenadas
  por volume, com total e posição no ranking.
- **FR-105**: Toda alteração feita no backoffice MUST ser persistida de forma que
  sobreviva a reinício do servidor.
- **FR-106**: Toda alteração feita no backoffice MUST ser registrada com autor, data
  e conteúdo alterado.
- **FR-107**: Nenhum dado de sessão, credencial ou token MUST ser enviado ao cliente
  em HTML ou JavaScript.

### Organização de mídia

- **FR-108**: Os arquivos de mídia MUST ficar no diretório `files/` na raiz do
  projeto, organizados em subpastas por tipo — `files/pics`, `files/videos` e
  `files/audio` — e MUST ser servidos estaticamente sob a URL `/files/...`.
- **FR-109**: O conteúdo MUST referenciar a mídia pelo caminho relativo dentro de
  `files/` (ex.: `pics/show-sampa/01.jpg`), de modo que nenhum caminho absoluto
  ou específico de máquina apareça no repositório.
- **FR-110**: O build MUST validar a existência de todo arquivo de mídia
  referenciado; arquivo ausente MUST falhar o build com a indicação do caminho.
- **FR-111**: O mosaico MUST apresentar posts de vídeo usando imagem de capa
  (poster) estática; o arquivo de vídeo MUST NOT ser baixado automaticamente e só
  MUST ser carregado e reproduzido após interação explícita da visitante.
- **FR-112**: Post de vídeo sem imagem de capa MUST ser exibido com um visual
  substituto, e o build MUST reportar a ausência como aviso.
- **FR-113**: A página de post MUST permitir a reprodução do vídeo com controles
  acessíveis, e MUST oferecer o download/abrimento do arquivo original.
- **FR-114**: Formato de vídeo MUST ser aceito de forma universal em navegadores
  modernos, com o arquivo original preservado no repositório e servível a partir de
  `/files/videos/...`.

### Conteúdo e apresentação

- **FR-115**: A identidade visual MUST ser definida por tokens centralizados (cor,
  tipografia, espaçamento, raio, sombra, brilho), sem valores literais em
  componentes.
- **FR-116**: O site MUST oferecer tema claro e escuro, alternáveis, com a preferência
  da visitante respeitada e valor padrão do sistema quando não houver escolha salva.
- **FR-117**: A barra superior, o mosaico/feed e o player inferior MUST manter a
  hierarquia visual em todas as páginas e tamanhos de tela.
- **FR-118**: O site MUST ser utilizável por teclado, com foco visível e rótulos
  acessíveis nos controles da barra superior, do alternador de modo, do carrossel, do
  player e do backoffice.
- **FR-119**: Alvos de toque dos controles MUST ter no mínimo 44px de área
  interativa.

### Qualidade e operação

- **FR-120**: O site MUST manter o conteúdo principal legível sem JavaScript
  (renderizado no servidor), com as interações opcionais degradando graciosamente.
- **FR-121**: O site MUST manter o peso total da primeira visualização em até 150 KB
  comprimidos e o JavaScript entregue ao cliente em até 30 KB gzip.
- **FR-122**: Imagens MUST ser servidas em formato moderno com dimensões declaradas
  e carregamento adiado fora da primeira tela.
- **FR-123**: O site MUST ser servível a partir de uma VPS própria com Node, por
  processo único, com artefato de build estático e rotas dinâmicas apenas onde
  necessário (contadores de popularidade, autenticação, backoffice).
- **FR-124**: O deploy MUST ser documentado e repetível a partir de um comando
  documentado, incluindo instalação de dependências, build e reinício do serviço.

### Armazenamento, versionamento e evolução

- **FR-125**: Todo o conteúdo do site MUST ser armazenado em arquivos, com caminho
  canônico: `content/` para o conteúdo editorial (posts em `content/<ano>/<mes>.md`,
  ordem das pastas em `content/index.md`, discografia, agenda e postagens privadas),
  `files/` para a mídia e `data/` para o estado de runtime (contadores, sessões,
  auditoria).
- **FR-126**: `data/` MUST NOT entrar no repositório versionado, e seu conteúdo MUST
  ser regenerável ou irrelevante para o acervo.
- **FR-127**: Nenhuma página, rota, template ou componente MUST ler o disco ou o
  banco diretamente; todo acesso a dados MUST passar por interfaces estáveis de
  repositório, uma por tipo de dado.
- **FR-128**: A implementação das interfaces de repositório MUST ser intercambiável:
  substituir a implementação em arquivo por uma em banco MUST NOT exigir alteração
  em página, rota ou no contrato entregue ao visitante.
- **FR-129**: O backoffice MUST gravar cada alteração de conteúdo em arquivo e
  versioná-la em commit automático, com mensagem descritiva e identificação da
  autora.
- **FR-130**: Cada alteração de conteúdo MUST ser refletida nas páginas em até 5
  segundos, sem republicação manual e sem reinício do servidor.
- **FR-131**: O repositório MUST manter, para cada alteração, o histórico do autor,
  da data e do conteúdo alterado, recuperável a partir do versionamento.
- **FR-132**: O sistema MUST prover um comando documentado de migração que leia o
  conteúdo dos arquivos e o grave em um banco de dados, sem alteração nas páginas
  e rotas, mantendo o versionamento como backup do acervo.
- **FR-133**: A leitura de conteúdo MUST invalidar o cache próprio quando o
  arquivo correspondente mudar, de modo que o valor exibido seja sempre o da última
  versão publicada.
- **FR-134**: A migração para banco MUST ser adiada até o volume do acervo
  justificá-la; o gatilho MUST ser observado — leitura de conteúdo acima do
  orçamento de performance, histórico de commits que atrapalha a gestão do acervo
  pela artista, ou consultas e filtros que o modelo em arquivo não atende bem
  (busca complexa, estatísticas, múltiplas ordenações). Nenhuma dessas condições
  MUST ser tratada como motivo para antecipar a migração.

### Key Entities *(include if feature involves data)*

- **Post**: publicação nomeada pela artista. Atributos: slug, nome, data, categoria
  (`feed` | `show` | `lancamento` | `evento`), pasta, lista de mídias, descrição,
  estado privado, ordem no índice de pastas. Relaciona-se com Contador de
  Popularidade, Timeline e com a página de post.
- **Pasta**: diretório próprio de um post dentro de `files/pics/`, que concentra as
  mídias daquele post. O nome carrega a data e hora de cadastro do post no formato
  `dd-mm-aaa-hh-mm-ss`, seguida do slug do nome do post.
- **Categoria**: conjunto fechado de cinco valores que define se o post aparece na
  timeline (`feed` exclui; `show`, `lancamento`, `evento` e `trabalhos` incluem).
- **Descrição**: texto livre do post em Markdown, arquivado em arquivos por ano e
  mês.
- **Índice de pastas**: arquivo que define a ordem das pastas (dos posts) exibida na
  ordenação "por pasta".
- **Contador de Popularidade**: par post + quantidade de cliques acumulados. Não
  possui identificador de visitante.
- **Evento da Agenda**: compromisso, show, feira, workshop ou lançamento. Atributos:
  título, data, descrição, cartaz, links externos, marcação de divulgação por
  e-mail, estado (futuro | passado).
- **Release (lançamento)**: publicação da discografia. Atributos: slug, título, tipo
  (álbum | EP | single | compilação), ano, data de lançamento (opcional), capa, faixas,
  links externos.
- **Faixa**: música de um release. Atributos: título, duração, letra, arquivo de
  áudio em `files/audio`, ordem.
- **Arquivo de Mídia**: recurso dentro de `files/` (imagem, vídeo ou áudio).
  Atributos: caminho relativo ao diretório `files/`, tipo, e imagem de capa
  (poster) quando for vídeo.
- **Conta da Artista**: credencial única de administração. Atributos: usuário, hash
  da senha, estado de bloqueio, data da última tentativa malsucedida.
- **Sessão**: sessão autenticada da artista. Atributos: identificador opaco, data de
  criação, expiração.
- **Registro de Auditoria**: rastro de alterações do backoffice. Atributos: autor,
  data, ação, conteúdo alterado.
- **Resultado de Busca**: item correspondente a um termo, com referência ao tipo e ao
  identificador do conteúdo encontrado.
- **Repositório**: interface estável de acesso a um tipo de dado (post, evento de
  agenda, lançamento, faixa, contador, sessão, auditoria). A implementação atual
  lê e grava arquivos; a substituição por banco é feita em nova implementação da
  mesma interface.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A home renderiza o mosaico com todos os posts em até 2 segundos em
  conexão 4G simulada, com LCP abaixo de 2,5 s.
- **SC-002**: O deslocamento cumulativo de layout da home é inferior a 0,1,
  incluindo o cálculo de tamanhos por popularidade.
- **SC-003**: O peso total da primeira visualização é inferior a 150 KB comprimidos e
  o JavaScript entregue ao cliente é inferior a 30 KB gzip, verificados
  automaticamente a cada build.
- **SC-004**: 100% dos controles da barra superior, do alternador de modo, do
  carrossel e do player são operáveis exclusivamente por teclado, com foco visível
  em 100% deles.
- **SC-005**: Toda ação de busca retorna resposta em até 500 ms para o volume de
  conteúdo inicial previsto, e nunca dispara mais de uma requisição por pausa na
  digitação.
- **SC-006**: O clique em um post é refletido no ranking em até 5 segundos após a
  ação, e o ranking do item sobe exatamente uma posição por clique.
- **SC-007**: A reprodução de áudio continua ativa durante a navegação por todas as
  páginas do site, sem interrupção ou reinício.
- **SC-008**: O site permanece inteiramente navegável e legível com JavaScript
  desabilitado, com exceção das interações explicitamente opcionais.
- **SC-009**: Nenhum dado pessoal de visitante é persistido; a auditoria do
  armazenamento confirma apenas contadores agregados e preferências de tema, modo de
  visualização, ordenação, volume e estado do player.
- **SC-010**: A artista publica uma foto avulsa ou um carrossel sem programador:
  copiar o arquivo para a pasta do post e acrescentar a entrada em
  `content/<ano>/<mes>.md` é suficiente para o post aparecer na home e na busca
  após o build.
- **SC-011**: A troca entre feed e mosaico, e entre as ordenações, ocorre sem
  recarregar a página e com menos de 200 ms de atraso percebido.
- **SC-012**: 100% dos posts classificados como `show`, `lancamento`, `evento` ou
  `trabalhos` aparecem na timeline, e 100% dos posts de categoria `feed` e todos os
  posts privados ficam de fora de qualquer página pública e da busca.
- **SC-013**: A artista cadastra um evento da agenda em até 2 minutos, sem tocar em
  código, e ele fica visível na agenda pública em até 5 segundos.
- **SC-014**: 100% das tentativas de login com credencial inválida são registradas, e
  após 10 tentativas seguidas a conta é bloqueada por no mínimo 15 minutos.
- **SC-015**: Nenhum arquivo do backoffice é acessível sem sessão válida; um teste
  automatizado confirma que cada rota protegida responde com redirecionamento para o
  login.
- **SC-016**: A tracklist de um lançamento exibe 100% das faixas com letra quando a
  letra existir, e nenhuma faixa some da lista por falta de letra.
- **SC-017**: Toda publicação feita pelo backoffice aparece no acervo em até 5
  segundos e gera um commit no repositório com autor e mensagem.
- **SC-018**: Trocar a implementação de repositório de arquivo por banco não altera
  nenhuma página, rota ou resposta entregue ao visitante — verificado por teste que
  executa o mesmo conjunto de casos contra as duas implementações.
- **SC-019**: A fonte padrão do player toca o lançamento mais recente primeiro, e a
  sequência dos lançamentos na playlist está em ordem estritamente decrescente de
  data de lançamento, verificada por teste automatizado sobre a discografia real.

## Assumptions

- O público-alvo são visitantes casuais chegando por link compartilhado em celular,
  majoritariamente em conexão móvel instável.
- O idioma do site é português do Brasil; conteúdo editorial e textos de interface
  nesse idioma.
- "Mais cliques" significa o número de vezes que o post foi aberto a partir da home
  (mosaico ou feed), e não visualizações em listagens.
- A popularidade é um contador acumulado desde a publicação do site, sem janela
  temporal; com todos os contadores zerados, o mosaico exibe todos os posts em ordem
  estável (mais recentes primeiro).
- O mosaico é renderizado no servidor com o ranking do momento do carregamento; os
  cliques dados durante a sessão só alteram ordem e tamanho dos tiles na próxima
  carga da página.
- Os contadores de popularidade são mantidos em armazenamento local da VPS
  (arquivo/ SQLite), dado o volume esperado de tráfego de uma artista independente.
- O acervo é organizado em posts com pasta própria; não existe coleção que agrupe
  vários posts. A "coleção" citada como fonte de reprodução do player é a
  organização do acervo usada na discografia, não um agrupamento de posts.
- **Todo o conteúdo é salvo em arquivo**, e a publicação pelo backoffice grava
  arquivo e versiona em commit. O versionamento é o histórico, o backup e a
  auditoria do acervo.
- **Um banco de dados pode ser adicionado futuramente** sem reescrever o site: todo
  acesso a dados passa por interfaces de repositório cuja implementação hoje é em
  arquivo. A migração é um comando de leitura e escrita, e o git segue como backup.
- **Enquanto o acervo for pequeno, o arquivo é a escolha certa** e a migração fica
  adiada. O gatilho é observado, não calendarizado (ver FR-134): leitura acima do
  orçamento de performance, histórico de commits atrapalhando a gestão do acervo,
  ou consultas que o modelo em arquivo não atende bem.
- A categoria `trabalhos` é genérica: cobre lançamentos, álbuns, shows, eventos, lives
  e qualquer outra obra da artista que não caiba nos rótulos específicos. A
  diferenciação entre um post e outro é feita pelo nome e pela descrição, não pela
  categoria; a categoria existe apenas para decidir a entrada na timeline.
- A ordem das pastas é definida exclusivamente pelo índice escrito pela artista
  (`content/index.md`); o site não infere ordem a partir do sistema de arquivos.
- As descrições dos posts ficam em arquivos Markdown por ano e mês
  (`content/<ano>/<mes>.md`), com os metadados de cada post em bloco próprio no
  formato YAML e o texto da descrição em Markdown livre; o formato exato de
  delimitação entre posts é decidido na fase de planejamento.
- A mídia do site vive em `files/` na raiz do repositório, com `files/pics` para
  imagens (obras, capas, posters, cartazes, avatares), `files/videos` para vídeos e
  `files/audio` para as faixas do player; a mesma árvore é versionada no Git e
  publicada estaticamente em `/files/...`.
- Os vídeos são publicados em formato aceito por navegadores modernos (H.264 em
  contêiner MP4), mantendo o arquivo original para download.
- O player usa o elemento de áudio nativo do navegador; as faixas ficam em
  `files/audio` e são listadas em um arquivo de dados versionado.
- A fonte padrão do player é "lançamentos": todas as faixas, dos lançamentos mais
  novos para os mais antigos. A ordem entre lançamentos usa a data de lançamento
  quando existir, senão o ano; empates são resolvidos pelo slug, de forma estável.
- A discografia é uma seção própria, com lançamentos, faixas e letras; não substitui
  os posts de imagem do acervo.
- Existe exatamente uma conta de administração, provisionada na instalação e
  pertencente à artista. Não há cadastro público, recuperação de senha por e-mail
  nem novos papéis de usuário.
- A agenda é alimentada pelo backoffice; os posts e a discografia podem ser mantidos
  por arquivos versionados ou pelo backoffice, conforme o plano.
- A artista publica o conteúdo editando arquivos Markdown e de mídia; não haverá
  CMS público nem painel de edição para o público em geral.
- **Mailing list e canal de comunidade (chatbot) estão fora do escopo desta spec.**
  Serão specs futuras. A agenda já prevê a marcação "divulgar por e-mail" para que
  a integração futura não exija migração de dados.
- Não há loja, carrinho ou checkout no escopo inicial: eventual compra é
  encaminhada para plataformas externas já existentes da artista.
- Não há comentários de visitantes nem seção de membros.
- Hospedagem em VPS própria com Node, com reverse proxy na frente; o domínio e o
  certificado ficam a cargo da operação.
- O desenvolvimento só começa após a documentação básica estar concluída e
  explicitamente autorizada.
