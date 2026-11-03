import { describe, expect, it } from 'vitest';
import { conferirSenha, gerarHash } from '~/lib/auth/password';
import {
  chaveLogin,
  estaBloqueado,
  permitirRequisicao,
  registrarFalha,
  registrarSucesso,
} from '~/lib/auth/rate-limit';

describe('senha da artista', () => {
  it('gera hash com salt e confere a senha', async () => {
    const hash = await gerarHash('senha-secreta-123');
    expect(hash).toMatch(/^scrypt\$/);
    expect(hash).not.toContain('senha-secreta-123');
    expect(await conferirSenha('senha-secreta-123', hash)).toBe(true);
  });

  it('recusa senha errada', async () => {
    const hash = await gerarHash('senha-secreta-123');
    expect(await conferirSenha('outra-senha', hash)).toBe(false);
  });

  it('gera hashes diferentes para a mesma senha', async () => {
    const a = await gerarHash('mesma-senha-123');
    const b = await gerarHash('mesma-senha-123');
    expect(a).not.toBe(b);
  });
});

describe('bloqueio de login', () => {
  it('bloqueia após 10 falhas', () => {
    const chave = chaveLogin('artista', '1.1.1.1');
    for (let i = 0; i < 9; i++) registrarFalha(chave);
    expect(estaBloqueado(chave)).toBe(false);
    registrarFalha(chave);
    expect(estaBloqueado(chave)).toBe(true);
  });

  it('libera o bloqueio após login bem-sucedido', () => {
    const chave = chaveLogin('artista2', '1.1.1.1');
    registrarFalha(chave);
    registrarSucesso(chave);
    expect(estaBloqueado(chave)).toBe(false);
  });
});

describe('rate limit por IP', () => {
  it('permite até o limite e bloqueia depois', () => {
    const chave = 'teste:bucket';
    expect(permitirRequisicao(chave, 3)).toBe(true);
    expect(permitirRequisicao(chave, 3)).toBe(true);
    expect(permitirRequisicao(chave, 3)).toBe(true);
    expect(permitirRequisicao(chave, 3)).toBe(false);
  });
});
