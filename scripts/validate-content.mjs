/**
 * Valida o acervo antes do build: schema dos posts, categoria, data, existência
 * de mídia e de pasta, e o índice de pastas.
 *
 * Uso: npm run validate:content
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { dividirDocumentos, separarFrontmatter, separarArquivo } from '../src/lib/markdown.ts';

const RAIZ = process.cwd();
const CONTENT = join(RAIZ, 'content');
const FILES = join(RAIZ, 'files');

const CATEGORIAS = ['feed', 'show', 'lancamento', 'evento', 'trabalhos'];
const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
const RE_PASTA = /^\d{2}-\d{2}-\d{4}-\d{2}-\d{2}-\d{2}(?:-[a-z0-9-]+)?$/;

const erros = [];
const avisos = [];

function erro(arquivo, mensagem) {
  erros.push(`${relative(RAIZ, arquivo)} — ${mensagem}`);
}

function aviso(arquivo, mensagem) {
  avisos.push(`${relative(RAIZ, arquivo)} — ${mensagem}`);
}

async function existe(caminho) {
  try {
    const info = await stat(caminho);
    return info.isFile();
  } catch {
    return false;
  }
}

async function existeDir(caminho) {
  try {
    const info = await stat(caminho);
    return info.isDirectory();
  } catch {
    return false;
  }
}

async function validarPosts(arquivo, raiz) {
  const bruto = await readFile(arquivo, 'utf8');
  const blocos = dividirDocumentos(bruto);

  for (const documento of blocos) {
    const { dados } = separarFrontmatter(documento.frontmatter, documento.corpo);

    if (!dados.nome) erro(arquivo, 'campo "nome" é obrigatório');
    if (!dados.data || !RE_DATA.test(dados.data)) {
      erro(arquivo, `data "${dados.data ?? ''}" inválida (esperado YYYY-MM-DD)`);
    } else {
      const partes = relative(raiz, arquivo).split(/[\\/]/);
      const anoArquivo = partes[0] ?? '';
      const mesArquivo = (partes[1] ?? '').replace(/\.md$/, '');
      if (anoArquivo && mesArquivo) {
        const anoMes = dados.data.slice(0, 7);
        if (anoMes !== `${anoArquivo}-${mesArquivo}`) {
          erro(arquivo, `data "${dados.data}" não pertence ao mês do arquivo`);
        }
      }
    }
    if (!dados.categoria || !CATEGORIAS.includes(dados.categoria)) {
      erro(
        arquivo,
        `categoria "${dados.categoria ?? ''}" inválida; use ${CATEGORIAS.join(', ')}`,
      );
    }
    if (!dados.pasta) {
      erro(arquivo, 'campo "pasta" é obrigatório');
    } else {
      if (!RE_PASTA.test(dados.pasta)) {
        aviso(arquivo, `pasta "${dados.pasta}" fora do padrão dd-mm-aaa-hh-mm-ss-nome`);
      }
      const caminhoPasta = join(FILES, 'pics', dados.pasta);
      if (!(await existeDir(caminhoPasta))) {
        erro(arquivo, `pasta não encontrada: files/pics/${dados.pasta}`);
      }
    }

    const midias = Array.isArray(dados.midias) ? dados.midias : [];
    if (!midias.length) erro(arquivo, 'campo "midias" precisa de ao menos um item');
    for (const midia of midias) {
      if (!(await existe(join(FILES, midia)))) {
        erro(arquivo, `mídia não encontrada: ${midia}`);
      }
    }
  }
}

async function listarMd(dir) {
  const encontrados = [];
  let entradas;
  try {
    entradas = await readdir(dir, { withFileTypes: true });
  } catch {
    return encontrados;
  }
  for (const entrada of entradas) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) encontrados.push(...(await listarMd(caminho)));
    else if (entrada.isFile() && entrada.name.endsWith('.md')) encontrados.push(caminho);
  }
  return encontrados;
}

async function main() {
  const meses = await listarMd(CONTENT);
  for (const arquivo of meses) {
    const relativo = relative(CONTENT, arquivo).split(/[\\/]/);
    if (relativo[0] === 'index.md') continue;
    if (['agenda', 'discografia', 'colecoes'].includes(relativo[0])) continue;
    await validarPosts(arquivo, relativo[0] === 'privado' ? join(CONTENT, 'privado') : CONTENT);
  }

  const indice = join(CONTENT, 'index.md');
  if (await existe(indice)) {
    const bruto = await readFile(indice, 'utf8');
    const { frontmatter, corpo } = separarArquivo(bruto);
    const { dados } = separarFrontmatter(frontmatter, corpo);
    const pastas = Array.isArray(dados.pastas) ? dados.pastas : [];
    for (const pasta of pastas) {
      if (!(await existeDir(join(FILES, 'pics', pasta)))) {
        erro(indice, `pasta listada não existe: files/pics/${pasta}`);
      }
    }
  }

  for (const aviso of avisos) console.warn(`aviso: ${aviso}`);

  if (erros.length) {
    console.error(`\n${erros.length} erro(s) de conteúdo:\n- ${erros.join('\n- ')}`);
    process.exit(1);
  }

  console.log('Conteúdo válido.');
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
