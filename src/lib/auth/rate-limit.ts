interface Tentativa {
  falhas: number;
  primeiraFalhaEm: number;
  bloqueadoAte: number;
}

const JANELA_FALHAS_MS = 15 * 60 * 1000;
const MAX_FALHAS = 10;
const BLOQUEIO_MS = 15 * 60 * 1000;

const tentativas = new Map<string, Tentativa>();

export function chaveLogin(usuario: string, ip: string): string {
  return `${usuario.toLowerCase()}|${ip}`;
}

export function estaBloqueado(chave: string): boolean {
  const registro = tentativas.get(chave);
  if (!registro) return false;
  if (registro.bloqueadoAte > Date.now()) return true;
  if (registro.bloqueadoAte > 0 && registro.primeiraFalhaEm + JANELA_FALHAS_MS < Date.now()) {
    tentativas.delete(chave);
  }
  return false;
}

export function registrarFalha(chave: string): void {
  const agora = Date.now();
  const registro = tentativas.get(chave);

  if (!registro || registro.primeiraFalhaEm + JANELA_FALHAS_MS < agora) {
    tentativas.set(chave, { falhas: 1, primeiraFalhaEm: agora, bloqueadoAte: 0 });
    return;
  }

  const falhas = registro.falhas + 1;
  tentativas.set(chave, {
    falhas,
    primeiraFalhaEm: registro.primeiraFalhaEm,
    bloqueadoAte: falhas >= MAX_FALHAS ? agora + BLOQUEIO_MS : 0,
  });
}

export function registrarSucesso(chave: string): void {
  tentativas.delete(chave);
}

/** Token bucket simples: `limite` requisições por `janelaMs`, por chave. */
const baldes = new Map<string, { tokens: number; atualizadoEm: number }>();

export function permitirRequisicao(chave: string, limite = 60, janelaMs = 60_000): boolean {
  const agora = Date.now();
  const balde = baldes.get(chave);
  if (!balde || agora - balde.atualizadoEm >= janelaMs) {
    baldes.set(chave, { tokens: limite - 1, atualizadoEm: agora });
    return true;
  }
  if (balde.tokens <= 0) return false;
  balde.tokens -= 1;
  balde.atualizadoEm = agora;
  return true;
}
