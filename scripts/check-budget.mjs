/**
 * Gate de performance: sobe o servidor construído e mede a primeira
 * visualização real.
 *
 * Orçamento (constitution, Princípio I):
 *   - primeira visualização (HTML + CSS + JS) ≤ 150 KB comprimidos
 *   - JavaScript entregue ao cliente ≤ 30 KB gzip
 *
 * Uso: node scripts/check-budget.mjs [--detalhe]
 */
import { spawn } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, extname, relative } from 'node:path';
import { setTimeout as esperar } from 'node:timers/promises';

const RAIZ = process.cwd();
const DIST_CLIENT = join(RAIZ, 'dist', 'client');
const ENTRADA = join(RAIZ, 'dist', 'server', 'entry.mjs');

const ORCAMENTO_TOTAL = 150 * 1024;
const ORCAMENTO_JS = 30 * 1024;
const PAGINAS = ['/', '/timeline', '/agenda', '/discografia'];

const detalhado = process.argv.includes('--detalhe');

async function listar(dir, filtro) {
  const encontrados = [];
  let entradas;
  try {
    entradas = await readdir(dir, { withFileTypes: true });
  } catch {
    return encontrados;
  }
  for (const entrada of entradas) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) encontrados.push(...(await listar(caminho, filtro)));
    else if (entrada.isFile() && filtro(caminho)) encontrados.push(caminho);
  }
  return encontrados;
}

async function gzipDe(arquivo) {
  return gzipSync(await readFile(arquivo)).length;
}

async function iniciarServidor(porta) {
  const processo = spawn(process.execPath, [ENTRADA], {
    cwd: RAIZ,
    env: { ...process.env, PORT: String(porta), HOST: '127.0.0.1' },
    stdio: 'ignore',
  });

  for (let i = 0; i < 60; i++) {
    try {
      const resposta = await fetch(`http://127.0.0.1:${porta}/`);
      if (resposta.ok) return processo;
    } catch {}
    await esperar(250);
  }
  processo.kill();
  throw new Error('servidor não subiu a tempo');
}

async function main() {
  const porta = 4399;
  const processo = await iniciarServidor(porta);

  try {
    const htmls = [];
    for (const pagina of PAGINAS) {
      const resposta = await fetch(`http://127.0.0.1:${porta}${pagina}`);
      const corpo = await resposta.text();
      htmls.push({ pagina, bytes: gzipSync(Buffer.from(corpo)).length, bruto: corpo.length });
    }

    const css = await listar(DIST_CLIENT, (c) => extname(c) === '.css');
    const js = await listar(DIST_CLIENT, (c) => ['.js', '.mjs'].includes(extname(c)));

    let cssGzip = 0;
    let jsGzip = 0;
    for (const arquivo of css) cssGzip += await gzipDe(arquivo);
    for (const arquivo of js) jsGzip += await gzipDe(arquivo);

    const home = htmls[0];
    const total = home.bytes + cssGzip + jsGzip;

    const linhas = [
      'Orçamento de performance',
      `  HTML home (gzip):  ${(home.bytes / 1024).toFixed(1)} KB`,
      `  CSS (gzip):         ${(cssGzip / 1024).toFixed(1)} KB`,
      `  JS  (gzip):         ${(jsGzip / 1024).toFixed(1)} KB / ${(ORCAMENTO_JS / 1024).toFixed(0)} KB`,
      `  Total 1ª visão:     ${(total / 1024).toFixed(1)} KB / ${(ORCAMENTO_TOTAL / 1024).toFixed(0)} KB`,
      '',
      '  Páginas:',
      ...htmls.map((h) => `    ${h.pagina.padEnd(14)} ${(h.bytes / 1024).toFixed(1)} KB gzip (${(h.bruto / 1024).toFixed(1)} KB bruto)`),
    ];

    if (detalhado) {
      for (const arquivo of [...css, ...js]) {
        const info = await stat(arquivo);
        linhas.push(`    ${relative(DIST_CLIENT, arquivo)} — ${(info.size / 1024).toFixed(1)} KB`);
      }
    }

    console.log(linhas.join('\n'));

    const erros = [];
    if (jsGzip > ORCAMENTO_JS) {
      erros.push(`JS gzip ${(jsGzip / 1024).toFixed(1)} KB passa do orçamento de ${ORCAMENTO_JS / 1024} KB`);
    }
    if (total > ORCAMENTO_TOTAL) {
      erros.push(`primeira visualização ${(total / 1024).toFixed(1)} KB passa do orçamento de ${ORCAMENTO_TOTAL / 1024} KB`);
    }

    if (erros.length) {
      console.error(`\nOrçamento estourado:\n- ${erros.join('\n- ')}`);
      process.exitCode = 1;
      return;
    }

    console.log('\nDentro do orçamento.');
  } finally {
    processo.kill();
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
