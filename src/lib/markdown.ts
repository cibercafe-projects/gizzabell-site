import { marked } from 'marked';
import { parse as parseYaml } from 'yaml';

export interface Frontmatter {
  dados: Record<string, unknown>;
  corpo: string;
  linhaDados: number;
}

marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    // HTML cru do conteúdo nunca é renderizado (FR-024).
    html: () => '',
  },
});

const ESQUEMA_PERMITIDO = /^(https?|mailto|tel):/i;

function linkSeguro(href: string): string {
  const limpo = (href ?? '').trim();
  if (!limpo) return '#';
  // bloqueia javascript:, data:, vbscript: e afins
  if (/^[a-z][a-z0-9+.-]*:/i.test(limpo) && !ESQUEMA_PERMITIDO.test(limpo)) return '#';
  return limpo;
}
/**
 * Divide um arquivo multi-documento.
 *
 * Formato: cada documento começa com um bloco `---` de frontmatter e o corpo
 * segue até o próximo `---`, que já abre o frontmatter do documento seguinte.
 *
 *   ---
 *   nome: Post A
 *   ---
 *   corpo do post A
 *   ---
 *   nome: Post B
 *   ---
 *   corpo do post B
 */
export function dividirDocumentos(bruto: string): Array<{ frontmatter: string; corpo: string }> {
  const partes = bruto.split(/^[ \t]*---[ \t]*$/m);
  const documentos: Array<{ frontmatter: string; corpo: string }> = [];

  let i = 1;
  while (i < partes.length) {
    const parte = (partes[i] ?? '').trim();
    if (parte === '') {
      i += 1;
      continue;
    }

    if (pareceFrontmatter(parte)) {
      const corpo = partes[i + 1] ?? '';
      documentos.push({ frontmatter: parte, corpo });
      i += 2;
      continue;
    }

    // parte que não é frontmatter: separador extra dentro de um corpo
    const ultimo = documentos[documentos.length - 1];
    if (ultimo) ultimo.corpo += `\n---\n${partes[i] ?? ''}`;
    i += 1;
  }

  return documentos;
}

function pareceFrontmatter(texto: string): boolean {
  const primeira = texto.split('\n').find((l) => l.trim() !== '');
  if (!primeira) return false;
  return /^[A-Za-z_][\w-]*\s*:/.test(primeira.trim());
}

/** Separa o frontmatter YAML do corpo Markdown de um documento. */
export function separarFrontmatter(frontmatter: string, corpo = ''): Frontmatter {
  let dados: Record<string, unknown> = {};
  try {
    const bruto = parseYaml(frontmatter) as unknown;
    if (bruto && typeof bruto === 'object' && !Array.isArray(bruto)) {
      dados = bruto as Record<string, unknown>;
    }
  } catch (erro) {
    throw new Error(`frontmatter inválido: ${(erro as Error).message}`, { cause: erro });
  }

  return { dados, corpo, linhaDados: 1 };
}

/** Separa um arquivo de documento único (frontmatter + corpo). */
export function separarArquivo(texto: string): { frontmatter: string; corpo: string } {
  const partes = texto.split(/^[ \t]*---[ \t]*$/m);
  return {
    frontmatter: (partes[1] ?? '').trim(),
    corpo: partes.slice(2).join('\n---\n'),
  };
}
export function markdownParaHtml(md: string): string {
  const html = marked.parse(md ?? '', { async: false });
  if (typeof html !== 'string') return '';
  return html.replace(/href="([^"]*)"/g, (_m, href: string) => `href="${linkSeguro(href)}"`);
}

/** Texto puro, para busca e resumos. */
export function markdownParaTexto(md: string): string {
  return (md ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[#>*+-]+\s*/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function resumo(texto: string, limite = 160): string {
  const limpo = (texto ?? '').replace(/\s+/g, ' ').trim();
  if (limpo.length <= limite) return limpo;
  return `${limpo.slice(0, limite - 1).trimEnd()}…`;
}