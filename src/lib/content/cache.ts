import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

export const RAIZ = process.cwd();
export const DIR_CONTENT = join(RAIZ, 'content');
export const DIR_FILES = join(RAIZ, 'files');
export const DIR_DATA = join(RAIZ, 'data');

interface EntradaCache<T> {
  valor: T;
  assinatura: string;
}

const cache = new Map<string, EntradaCache<unknown>>();

/**
 * Assinatura de uma árvore de arquivos: caminhos + mtime.
 * Muda quando qualquer arquivo é criado, alterado ou removido.
 */
export async function assinaturaDeArvore(dir: string): Promise<string> {
  const partes: string[] = [];

  async function andar(atual: string): Promise<void> {
    let entradas;
    try {
      entradas = await readdir(atual, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entrada of entradas.sort((a, b) => a.name.localeCompare(b.name))) {
      const caminho = join(atual, entrada.name);
      if (entrada.isDirectory()) {
        partes.push(`d:${caminho}`);
        await andar(caminho);
      } else if (entrada.isFile()) {
        try {
          const info = await stat(caminho);
          partes.push(`f:${caminho}:${Math.floor(info.mtimeMs)}:${info.size}`);
        } catch {
          partes.push(`f:${caminho}:x`);
        }
      }
    }
  }

  await andar(dir);
  return partes.join('|');
}

/** Lê um arquivo único com cache invalidado pelo mtime. */
export async function lerComCache<T>(
  chave: string,
  caminho: string,
  produzir: (conteudo: string) => T | Promise<T>,
): Promise<T> {
  let mtime: number;
  try {
    const info = await stat(caminho);
    mtime = info.mtimeMs;
  } catch {
    mtime = 0;
  }

  const guardado = cache.get(chave) as (EntradaCache<T> & { mtime: number }) | undefined;
  if (guardado && guardado.mtime === mtime) return guardado.valor;

  let conteudo: string;
  try {
  conteudo = await readFile(caminho, 'utf8');
  } catch {
    conteudo = '';
  }

  const valor = await produzir(conteudo);
  cache.set(chave, { valor, assinatura: caminho, mtime } as never);
  return valor;
}

/** Lê um conjunto de arquivos com cache invalidado pela assinatura da árvore. */
export async function lerComAssinatura<T>(
  chave: string,
  dir: string,
  produzir: (assinatura: string) => T | Promise<T>,
): Promise<T> {
  const assinatura = await assinaturaDeArvore(dir);
  const guardado = cache.get(chave) as EntradaCache<T> | undefined;
  if (guardado && guardado.assinatura === assinatura) return guardado.valor;

  const valor = await produzir(assinatura);
  cache.set(chave, { valor, assinatura });
  return valor;
}

/** Invalida a entrada de cache de uma chave (usado após escrita pelo backoffice). */
export function invalidar(chave: string): void {
  cache.delete(chave);
}

export function limparCache(): void {
  cache.clear();
}
