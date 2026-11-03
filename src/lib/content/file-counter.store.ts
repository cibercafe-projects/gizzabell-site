import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIR_DATA } from '~/lib/content/cache';
import type { CounterStore } from '~/lib/content/repository';
import type { RankingPost } from '~/lib/content/types';

const ARQUIVO = join(DIR_DATA, 'counters.json');
const LIMITE_POR_POST = 1_000_000_000;

let contador: Map<string, number> | null = null;
let timer: NodeJS.Timeout | null = null;
let gravando = false;

async function carregar(): Promise<Map<string, number>> {
  if (contador) return contador;
  try {
    const bruto = await readFile(ARQUIVO, 'utf8');
    const dados = JSON.parse(bruto) as Record<string, unknown>;
    const mapa = new Map<string, number>();
    for (const [chave, valor] of Object.entries(dados)) {
      const n = Number(valor);
      if (Number.isFinite(n) && n >= 0) mapa.set(chave, Math.floor(n));
    }
    contador = mapa;
  } catch {
    contador = new Map();
  }
  return contador;
}

async function gravar(): Promise<void> {
  if (gravando) return;
  gravando = true;
  try {
    const mapa = contador ?? new Map<string, number>();
    const dados: Record<string, number> = {};
    for (const [chave, valor] of [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      dados[chave] = valor;
    }
    await mkdir(DIR_DATA, { recursive: true });
    const temporario = `${ARQUIVO}.tmp`;
    await writeFile(temporario, JSON.stringify(dados, null, 2), 'utf8');
    await rename(temporario, ARQUIVO);
  } catch {
    // Falha de gravação não pode derrubar o site: o contador volta do disco no boot.
  } finally {
    gravando = false;
  }
}

function agendarGravacao(): void {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    void gravar();
  }, 1000);
  timer.unref?.();
}

export const counterStore: CounterStore = {
  async get(slug: string): Promise<number> {
    const mapa = await carregar();
    return mapa.get(slug) ?? 0;
  },

  async increment(slug: string): Promise<number> {
    const mapa = await carregar();
    const atual = Math.min(mapa.get(slug) ?? 0, LIMITE_POR_POST);
    const proximo = atual + 1;
    mapa.set(slug, proximo);
    agendarGravacao();
    return proximo;
  },

  async ranking(): Promise<RankingPost[]> {
    const mapa = await carregar();
    const entradas = [...mapa.entries()].sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });
    return entradas.map(([slug, cliques], i) => ({ slug, cliques, posicao: i + 1 }));
  },
};

export async function gravarContadores(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  await gravar();
}
