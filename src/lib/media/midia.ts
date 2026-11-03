import { join } from 'node:path';
import { DIR_FILES } from '~/lib/content/cache';
import type { Midia } from '~/lib/content/types';
import { ehImagem, ehVideo, lerDimensoes, tipoMidia } from '~/lib/media/image-size';

const cacheDimensoes = new Map<string, { largura: number | null; altura: number | null }>();

export async function criarMidia(caminhoRelativo: string): Promise<Midia> {
  const limpo = caminhoRelativo.replace(/^\/+/, '');
  const url = `/files/${limpo}`;
  const tipo = tipoMidia(limpo);

  let dimensao = cacheDimensoes.get(limpo);
  if (!dimensao) {
    if (ehImagem(limpo)) {
      const d = await lerDimensoes(join(DIR_FILES, limpo));
      dimensao = { largura: d?.largura ?? null, altura: d?.altura ?? null };
    } else {
      dimensao = { largura: null, altura: null };
    }
    cacheDimensoes.set(limpo, dimensao);
  }

  return {
    caminho: limpo,
    url,
    tipo: tipo === 'audio' ? 'imagem' : tipo,
    largura: dimensao.largura,
    altura: dimensao.altura,
  };
}

export function ehMidiaVideo(caminhoRelativo: string): boolean {
  return ehVideo(caminhoRelativo);
}
