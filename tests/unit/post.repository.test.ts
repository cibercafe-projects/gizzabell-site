import { describe, expect, it } from 'vitest';
import { postRepository } from '~/lib/content/file-post.repository';

describe('repositório de posts', () => {
  it('lê os posts do acervo de exemplo', async () => {
    const posts = await postRepository.list();
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.map((p) => p.slug)).toContain('show-na-casa-blue');
  });

  it('encontra um post pelo slug', async () => {
    const post = await postRepository.getBySlug('show-na-casa-blue');
    expect(post).not.toBeNull();
    expect(post?.nome).toBe('Show na Casa Blue');
    expect(post?.categoria).toBe('show');
  });

  it('devolve null para slug inexistente', async () => {
    const post = await postRepository.getBySlug('nao-existe');
    expect(post).toBeNull();
  });

  it('deduz o formato a partir da quantidade de mídias', async () => {
    const posts = await postRepository.list();
    const carrossel = posts.find((p) => p.slug === 'show-na-casa-blue');
    const simples = posts.find((p) => p.slug === 'capa-do-ep-neon');
    expect(carrossel?.formato).toBe('carrossel');
    expect(simples?.formato).toBe('foto');
  });

  it('não expõe posts privados na listagem pública', async () => {
    const publicos = await postRepository.list();
    const todos = await postRepository.list({ incluirPrivados: true });
    expect(todos.length).toBeGreaterThanOrEqual(publicos.length);
    expect(publicos.every((p) => !p.privado)).toBe(true);
  });
});
