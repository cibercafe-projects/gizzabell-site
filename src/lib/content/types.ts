export type Categoria = 'feed' | 'show' | 'lancamento' | 'evento' | 'trabalhos';

export const CATEGORIAS: readonly Categoria[] = [
  'feed',
  'show',
  'lancamento',
  'evento',
  'trabalhos',
];

/** Categorias que também entram na timeline. `feed` é exclusivo da home. */
export const CATEGORIAS_TIMELINE: readonly Categoria[] = [
  'show',
  'lancamento',
  'evento',
  'trabalhos',
];

export type FormatoPost = 'foto' | 'video' | 'carrossel';

export interface Midia {
  /** caminho relativo a `files/`, ex.: `pics/14-11-2026-18-30-45-show/01.webp` */
  caminho: string;
  /** URL pública */
  url: string;
  tipo: 'imagem' | 'video';
  largura: number | null;
  altura: number | null;
}

export interface Post {
  slug: string;
  nome: string;
  data: string;
  categoria: Categoria;
  pasta: string;
  midias: Midia[];
  poster: Midia | null;
  descricao: string;
  descricaoHtml: string;
  resumo: string;
  tags: string[];
  privado: boolean;
  formato: FormatoPost;
  url: string;
  capa: Midia | null;
}

export interface EventoAgenda {
  slug: string;
  titulo: string;
  data: string;
  local: string;
  cidade: string;
  descricao: string;
  descricaoHtml: string;
  cartaz: Midia | null;
  links: LinkExterno[];
  divulgarEmail: boolean;
  futuro: boolean;
}

export interface LinkExterno {
  rotulo: string;
  url: string;
}

export type TipoLancamento = 'album' | 'ep' | 'single' | 'compilacao';

export interface Faixa {
  titulo: string;
  slug: string;
  audio: Midia | null;
  duracao: string;
  letra: string;
  letraHtml: string;
}

export interface Lancamento {
  slug: string;
  nome: string;
  tipo: TipoLancamento;
  ano: number;
  data: string | null;
  capa: Midia | null;
  faixas: Faixa[];
  links: LinkExterno[];
  descricao: string;
  descricaoHtml: string;
  privado: boolean;
}

export interface ColecaoPlayer {
  slug: string;
  nome: string;
  faixas: string[];
}

export interface RankingPost {
  slug: string;
  cliques: number;
  posicao: number;
}
