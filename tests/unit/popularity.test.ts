import { describe, expect, it } from 'vitest';
import {
  aplicarTamanhos,
  ordenarPorData,
  ordenarPorPopularidade,
  tamanhoPorPosicao,
} from '~/lib/content/popularity';
import type { Post } from '~/lib/content/types';

function post(slug: string, data: string): Post {
  return {
    slug,
    nome: slug,
    data,
    categoria: 'feed',
    pasta: slug,
    midias: [],
    poster: null,
    descricao: '',
    descricaoHtml: '',
    resumo: '',
    tags: [],
    privado: false,
    formato: 'foto',
    url: `/post/${slug}`,
    capa: null,
  };
}

describe('ordenação e tamanho dos tiles', () => {
  it('ordena por data, do mais recente ao mais antigo', () => {
    const posts = [post('a', '2026-01-01'), post('b', '2026-12-01'), post('c', '2026-06-01')];
    expect(ordenarPorData(posts).map((p) => p.slug)).toEqual(['b', 'c', 'a']);
  });

  it('desempata por slug quando a data é igual', () => {
    const posts = [post('z', '2026-01-01'), post('a', '2026-01-01')];
    expect(ordenarPorData(posts).map((p) => p.slug)).toEqual(['a', 'z']);
  });

  it('ordena por popularidade decrescente', () => {
    const posts = [post('a', '2026-01-01'), post('b', '2026-01-01'), post('c', '2026-01-01')];
    const cliques = new Map([
      ['a', 3],
      ['b', 10],
      ['c', 1],
    ]);
    expect(ordenarPorPopularidade(posts, cliques).map((p) => p.slug)).toEqual(['b', 'a', 'c']);
  });

  it('define a escala de tamanho de forma discreta e determinística', () => {
    expect(tamanhoPorPosicao(0)).toBe('grande');
    expect(tamanhoPorPosicao(2)).toBe('grande');
    expect(tamanhoPorPosicao(3)).toBe('medio');
    expect(tamanhoPorPosicao(8)).toBe('medio');
    expect(tamanhoPorPosicao(9)).toBe('pequeno');
  });

  it('mantém o tamanho do tile ligado ao post, não à posição na grade', () => {
    const posts = Array.from({ length: 10 }, (_, i) => post(`p${i}`, '2026-01-01'));
    const cliques = new Map(posts.map((p, i) => [p.slug, 100 - i]));

    const comTamanho = aplicarTamanhos(posts, cliques);
    expect(comTamanho[0]?.tamanho).toBe('grande');
    expect(comTamanho[9]?.tamanho).toBe('pequeno');

    // invertendo a ordem da lista, os tamanhos continuam presos ao post
    const invertido = aplicarTamanhos([...posts].reverse(), cliques);
    const tamanhoDo = (lista: typeof comTamanho, slug: string): string | undefined =>
      lista.find((item) => item.post.slug === slug)?.tamanho;
    expect(tamanhoDo(invertido, 'p0')).toBe(tamanhoDo(comTamanho, 'p0'));
    expect(tamanhoDo(invertido, 'p9')).toBe(tamanhoDo(comTamanho, 'p9'));
  });
});
