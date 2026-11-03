import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const exec = promisify(execFile);
const RAIZ = process.cwd();

let diretorio: string;

beforeEach(async () => {
  diretorio = await mkdtemp(join(tmpdir(), 'gizzabell-conteudo-'));
  await mkdir(join(diretorio, 'content', '2026'), { recursive: true });
  await mkdir(join(diretorio, 'files', 'pics', '14-11-2026-18-30-45-ok'), { recursive: true });
  await writeFile(
    join(diretorio, 'files', 'pics', '14-11-2026-18-30-45-ok', '01.webp'),
    Buffer.from('RIFF....WEBPVP8 '),
    'utf8',
  );
});

afterEach(async () => {
  await rm(diretorio, { recursive: true, force: true });
});

async function validar(): Promise<{ stdout: string; stderr: string; codigo: number }> {
  try {
    const { stdout, stderr } = await exec(
      process.execPath,
      [join(RAIZ, 'scripts', 'validate-content.mjs')],
      {
        cwd: diretorio,
        env: { ...process.env, GIZZABELL_RAIZ: diretorio },
        timeout: 60_000,
      },
    );
    return { stdout, stderr, codigo: 0 };
  } catch (erro) {
    const e = erro as { stdout?: string; stderr?: string; code?: number };
    return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', codigo: e.code ?? 1 };
  }
}

async function escreverConteudo(conteudo: string): Promise<void> {
  await writeFile(join(diretorio, 'content', '2026', '11.md'), conteudo, 'utf8');
}

const POST_VALIDO = `---
formato: 1
nome: "Post válido"
data: 2026-11-14
categoria: show
pasta: 14-11-2026-18-30-45-ok
midias:
  - pics/14-11-2026-18-30-45-ok/01.webp
---

Descrição.
`;

describe('validação de conteúdo', () => {
  it('aceita um post bem formado', async () => {
    await escreverConteudo(POST_VALIDO);
    const resultado = await validar();
    expect(resultado.codigo).toBe(0);
  });

  it('rejeita categoria inválida', async () => {
    await escreverConteudo(POST_VALIDO.replace('categoria: show', 'categoria: concerto'));
    const resultado = await validar();
    expect(resultado.codigo).toBe(1);
    expect(resultado.stderr).toContain('concerto');
    expect(resultado.stderr).toContain('feed, show, lancamento, evento, trabalhos');
  });

  it('rejeita data fora do mês do arquivo', async () => {
    await escreverConteudo(POST_VALIDO.replace('data: 2026-11-14', 'data: 2026-10-14'));
    const resultado = await validar();
    expect(resultado.codigo).toBe(1);
    expect(resultado.stderr).toContain('não pertence ao mês');
  });

  it('rejeita mídia inexistente', async () => {
    await escreverConteudo(
      POST_VALIDO.replace('01.webp', '99.webp'),
    );
    const resultado = await validar();
    expect(resultado.codigo).toBe(1);
    expect(resultado.stderr).toContain('mídia não encontrada');
  });

  it('rejeita pasta inexistente', async () => {
    await escreverConteudo(POST_VALIDO.replace('14-11-2026-18-30-45-ok', '01-01-2026-00-00-00-fantasma'));
    const resultado = await validar();
    expect(resultado.codigo).toBe(1);
    expect(resultado.stderr).toContain('pasta não encontrada');
  });

  it('rejeita campo obrigatório ausente', async () => {
    await escreverConteudo(POST_VALIDO.replace('nome: "Post válido"\n', ''));
    const resultado = await validar();
    expect(resultado.codigo).toBe(1);
    expect(resultado.stderr).toContain('nome');
  });
});
