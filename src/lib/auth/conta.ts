import { join } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { DIR_DATA } from '~/lib/content/cache';
import { conferirSenha, gerarHash } from '~/lib/auth/password';

const ARQUIVO = join(DIR_DATA, 'admin.json');

export interface ContaSalva {
  usuario: string;
  hash: string;
  bloqueadoAte: string | null;
  ultimaFalha: string | null;
}

export async function lerConta(): Promise<ContaSalva | null> {
  try {
    const bruto = await readFile(ARQUIVO, 'utf8');
    const conta = JSON.parse(bruto) as ContaSalva;
    if (typeof conta?.usuario !== 'string' || typeof conta?.hash !== 'string') return null;
    return conta;
  } catch {
    return null;
  }
}

export async function salvarConta(conta: ContaSalva): Promise<void> {
  await mkdir(DIR_DATA, { recursive: true });
  await writeFile(ARQUIVO, JSON.stringify(conta, null, 2), 'utf8');
}

export async function criarConta(usuario: string, senha: string): Promise<ContaSalva> {
  const conta: ContaSalva = {
    usuario,
    hash: await gerarHash(senha),
    bloqueadoAte: null,
    ultimaFalha: null,
  };
  await salvarConta(conta);
  return conta;
}

export async function validarCredenciais(usuario: string, senha: string): Promise<boolean> {
  const conta = await lerConta();
  if (!conta) return false;
  if (conta.usuario.toLowerCase() !== usuario.toLowerCase()) {
    // mesma verificação para não revelar se o usuário existe pelo tempo de resposta
    await conferirSenha(senha, conta.hash);
    return false;
  }
  return conferirSenha(senha, conta.hash);
}
