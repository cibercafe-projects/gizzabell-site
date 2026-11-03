import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { ehImagem, ehVideo, lerDimensoes, mimeDe } from '~/lib/media/image-size';
import { analisarIntervalo } from '~/lib/media/serve';

const FIXTURES = join(process.cwd(), 'files', 'pics');

describe('leitor de dimensões', () => {
  it('lê as dimensões de uma imagem WebP', async () => {
    const arquivo = join(
      FIXTURES,
      '14-11-2026-18-30-45-show-casa-blue',
      '01.webp',
    );
    const dimensao = await lerDimensoes(arquivo);
    expect(dimensao).not.toBeNull();
    expect(dimensao?.largura).toBe(1200);
    expect(dimensao?.altura).toBe(1200);
  });

  it('devolve null para arquivo inexistente', async () => {
    expect(await lerDimensoes(join(FIXTURES, 'nao-existe.webp'))).toBeNull();
  });
});

describe('tipos de mídia', () => {
  it('classifica extensões', () => {
    expect(ehImagem('a/b.webp')).toBe(true);
    expect(ehVideo('a/b.mp4')).toBe(true);
    expect(ehImagem('a/b.mp4')).toBe(false);
  });

  it('devolve o mime type', () => {
    expect(mimeDe('a/b.webp')).toBe('image/webp');
    expect(mimeDe('a/b.mp4')).toBe('video/mp4');
    expect(mimeDe('a/b.desconhecido')).toBe('application/octet-stream');
  });
});

describe('intervalos HTTP (Range)', () => {
  it('interpreta bytes=0-1023', () => {
    expect(analisarIntervalo('bytes=0-1023', 5000)).toEqual({ inicio: 0, fim: 1023 });
  });

  it('interpreta bytes=100-', () => {
    expect(analisarIntervalo('bytes=100-', 5000)).toEqual({ inicio: 100, fim: 4999 });
  });

  it('interpreta bytes=-500 (últimos bytes)', () => {
    expect(analisarIntervalo('bytes=-500', 5000)).toEqual({ inicio: 4500, fim: 4999 });
  });

  it('rejeita intervalo inválido', () => {
    expect(analisarIntervalo('bytes=9000-9999', 5000)).toBe('invalido');
    expect(analisarIntervalo('bytes=abc', 5000)).toBeNull();
  });
});
