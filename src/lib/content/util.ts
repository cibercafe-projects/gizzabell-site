import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/** Lista arquivos `.md` de um diretório, ordenados por nome. */
export async function listarArquivosMd(dir: string): Promise<string[]> {
  try {
    const entradas = await readdir(dir, { withFileTypes: true });
    return entradas
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => join(dir, e.name))
      .sort();
  } catch {
    return [];
  }
}
