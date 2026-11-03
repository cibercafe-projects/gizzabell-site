import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIR_CONTENT, lerComAssinatura } from '~/lib/content/cache';
import { separarArquivo, separarFrontmatter } from '~/lib/markdown';
import { listaDeTexto, slugificar, textoOpcional } from '~/lib/content/schema';
import type { ColecaoPlayer } from '~/lib/content/types';
import type { CollectionRepository } from '~/lib/content/repository';
import { listarArquivosMd } from '~/lib/content/util';

export const collectionRepository: CollectionRepository = {
  async list(): Promise<ColecaoPlayer[]> {
    const dir = join(DIR_CONTENT, 'colecoes');
    return lerComAssinatura('colecoes', dir, async () => {
      const arquivos = await listarArquivosMd(dir);
      const colecoes: ColecaoPlayer[] = [];
      for (const caminho of arquivos) {
        let bruto: string;
        try {
  bruto = await readFile(caminho, 'utf8');
        } catch {
          continue;
        }
        const { frontmatter, corpo } = separarArquivo(bruto);
  const { dados } = separarFrontmatter(frontmatter, corpo);
        const nome = textoOpcional(dados.nome);
        if (!nome) continue;
        colecoes.push({
          slug: slugificar(nome) || slugificar(caminho),
          nome,
          faixas: listaDeTexto(dados.faixas),
        });
      }
      return colecoes;
    });
  },
};
