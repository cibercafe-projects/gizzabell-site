import type { Post } from '~/lib/content/types';

export type OrdemHome = 'data' | 'pasta' | 'popularidade';

export type TamanhoTile = 'grande' | 'medio' | 'pequeno';

export interface PostOrdenado {
  post: Post;
  tamanho: TamanhoTile;
  cliques: number;
}

export function ordenarPorData(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    if (a.data !== b.data) return b.data.localeCompare(a.data);
    return a.slug.localeCompare(b.slug);
  });
}

export function ordenarPorPopularidade(posts: Post[], cliques: Map<string, number>): Post[] {
  return [...posts].sort((a, b) => {
    const ca = cliques.get(a.slug) ?? 0;
    const cb = cliques.get(b.slug) ?? 0;
    if (ca !== cb) return cb - ca;
    if (a.data !== b.data) return b.data.localeCompare(a.data);
    return a.slug.localeCompare(b.slug);
  });
}

/**
 * Escala discreta e determinística por posição no ranking:
 * o tile cresce com a popularidade, sem saltos nem reordenação.
 */
export function tamanhoPorPosicao(posicao: number): TamanhoTile {
  if (posicao < 3) return 'grande';
  if (posicao < 9) return 'medio';
  return 'pequeno';
}

/** Posição de cada post no ranking de popularidade (0 = mais clicado). */
export function rankingDePosts(posts: Post[], cliques: Map<string, number>): Map<string, number> {
  const ordenados = [...posts].sort((a, b) => {
    const ca = cliques.get(a.slug) ?? 0;
    const cb = cliques.get(b.slug) ?? 0;
    if (ca !== cb) return cb - ca;
    return a.slug.localeCompare(b.slug);
  });
  const posicoes = new Map<string, number>();
  ordenados.forEach((post, i) => posicoes.set(post.slug, i));
  return posicoes;
}

/**
 * O tamanho do tile vem da posição no ranking de popularidade, e não da
 * posição na grade: assim o mosaico tem a mesma aparência em qualquer ordenação.
 */
export function aplicarTamanhos(
  posts: Post[],
  cliques: Map<string, number>,
): Array<{ post: Post; tamanho: TamanhoTile; cliques: number }> {
  const posicoes = rankingDePosts(posts, cliques);
  return posts.map((post) => ({
    post,
    tamanho: tamanhoPorPosicao(posicoes.get(post.slug) ?? Number.MAX_SAFE_INTEGER),
    cliques: cliques.get(post.slug) ?? 0,
  }));
}
