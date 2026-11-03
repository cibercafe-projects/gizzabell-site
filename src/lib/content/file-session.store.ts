import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { DIR_DATA } from '~/lib/content/cache';
import type { SessionStore } from '~/lib/content/repository';

const ARQUIVO = join(DIR_DATA, 'sessions.json');
const EXPIRA_EM_MS = 8 * 60 * 60 * 1000;

interface SessaoSalva {
  id: string;
  usuario: string;
  expiraEm: string;
}

let sessoes: Map<string, SessaoSalva> | null = null;

async function carregar(): Promise<Map<string, SessaoSalva>> {
  if (sessoes) return sessoes;
  try {
    const bruto = await readFile(ARQUIVO, 'utf8');
    const dados = JSON.parse(bruto) as SessaoSalva[];
    const mapa = new Map<string, SessaoSalva>();
    const agora = Date.now();
    for (const sessao of Array.isArray(dados) ? dados : []) {
      if (typeof sessao?.id !== 'string') continue;
      if (new Date(sessao.expiraEm).getTime() < agora) continue;
      mapa.set(sessao.id, sessao);
    }
    sessoes = mapa;
  } catch {
    sessoes = new Map();
  }
  return sessoes;
}

async function gravar(): Promise<void> {
  const mapa = sessoes ?? new Map<string, SessaoSalva>();
  try {
    await mkdir(DIR_DATA, { recursive: true });
    const temporario = `${ARQUIVO}.tmp`;
    await writeFile(temporario, JSON.stringify([...mapa.values()], null, 2), 'utf8');
    await rename(temporario, ARQUIVO);
  } catch {
    // sessão em memória continua válida
  }
}

export const sessionStore: SessionStore = {
  async create(usuario: string): Promise<{ id: string; expiraEm: Date }> {
    const mapa = await carregar();
    const id = randomBytes(32).toString('base64url');
    const expiraEm = new Date(Date.now() + EXPIRA_EM_MS);
    mapa.set(id, { id, usuario, expiraEm: expiraEm.toISOString() });
    await gravar();
    return { id, expiraEm };
  },

  async get(id: string): Promise<{ id: string; usuario: string; expiraEm: Date } | null> {
    const mapa = await carregar();
    const sessao = mapa.get(id);
    if (!sessao) return null;
    const expiraEm = new Date(sessao.expiraEm);
    if (expiraEm.getTime() < Date.now()) {
      mapa.delete(id);
      await gravar();
      return null;
    }
    return { id: sessao.id, usuario: sessao.usuario, expiraEm };
  },

  async destroy(id: string): Promise<void> {
    const mapa = await carregar();
    if (mapa.delete(id)) await gravar();
  },
};
