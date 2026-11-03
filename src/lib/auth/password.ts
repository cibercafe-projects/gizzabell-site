import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const N = 32768;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 256 * 1024 * 1024;

export async function gerarHash(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const derivada = await scrypt(senha, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${derivada.toString('base64')}`;
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  try {
    const partes = hash.split('$');
    if (partes.length !== 6 || partes[0] !== 'scrypt') return false;
    const n = Number(partes[1]);
    const r = Number(partes[2]);
    const p = Number(partes[3]);
    const salt = Buffer.from(partes[4] ?? '', 'base64');
    const esperado = Buffer.from(partes[5] ?? '', 'base64');
    const derivada = await scrypt(senha, salt, esperado.length || KEYLEN, {
      N: n,
      r,
      p,
      maxmem: MAXMEM,
    });
    return derivada.length === esperado.length && timingSafeEqual(derivada, esperado);
  } catch {
    return false;
  }
}
