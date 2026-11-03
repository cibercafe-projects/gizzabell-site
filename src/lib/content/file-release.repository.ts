import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIR_CONTENT, lerComAssinatura } from '~/lib/content/cache';
import { markdownParaHtml, separarArquivo, separarFrontmatter } from '~/lib/markdown';
import { criarMidia } from '~/lib/media/midia';
import { listaDeTexto, slugificar, textoOpcional } from '~/lib/content/schema';
import type { Faixa, Lancamento, LinkExterno, TipoLancamento } from '~/lib/content/types';
import type { ReleaseRepository } from '~/lib/content/repository';
import { listarArquivosMd } from '~/lib/content/util';

const TIPOS: TipoLancamento[] = ['album', 'ep', 'single', 'compilacao'];

function lerLinks(valor: unknown): LinkExterno[] {
  if (!Array.isArray(valor)) return [];
  const links: LinkExterno[] = [];
  for (const item of valor) {
    if (item && typeof item === 'object') {
      const registro = item as Record<string, unknown>;
      const url = textoOpcional(registro.url);
      if (!url) continue;
      links.push({ rotulo: textoOpcional(registro.rotulo) || url, url });
    }
  }
  return links;
}

/** Separa o corpo em descrição e seções `## Letra — <título>`. */
export function separarLetras(corpo: string): { descricao: string; letras: Map<string, string> } {
  const linhas = corpo.split(/\r?\n/);
  const descricao: string[] = [];
  const letras = new Map<string, string>();
  let tituloAtual: string | null = null;
  let buffer: string[] = [];

  const fechar = (): void => {
    if (tituloAtual) letras.set(tituloAtual, buffer.join('\n').trim());
    tituloAtual = null;
    buffer = [];
  };

  for (const linha of linhas) {
    const m = /^##\s+Letra\s+[—-]\s*(.+)$/i.exec(linha.trim());
    if (m) {
      fechar();
      tituloAtual = (m[1] ?? '').trim();
      continue;
    }
    if (tituloAtual) buffer.push(linha);
    else descricao.push(linha);
  }
  fechar();

  return { descricao: descricao.join('\n').trim(), letras };
}

async function construirLancamento(caminho: string, bruto: string): Promise<Lancamento | null> {
  const { frontmatter, corpo } = separarArquivo(bruto);
  const { dados } = separarFrontmatter(frontmatter, corpo);
  const nome = textoOpcional(dados.nome);
  if (!nome) return null;

  const tipoBruto = textoOpcional(dados.tipo) as TipoLancamento;
  const tipo = TIPOS.includes(tipoBruto) ? tipoBruto : 'single';
  const ano = Number(dados.ano) || 0;
  const data = textoOpcional(dados.data) || null;
  const { descricao, letras } = separarLetras(corpo);

  const faixasBrutas = Array.isArray(dados.faixas) ? dados.faixas : [];
  const faixas: Faixa[] = [];

  for (const item of faixasBrutas) {
    if (!item || typeof item !== 'object') continue;
    const registro = item as Record<string, unknown>;
    const titulo = textoOpcional(registro.titulo);
    if (!titulo) continue;
    const audioCaminho = textoOpcional(registro.audio);
    const letra = letras.get(titulo) ?? '';

    faixas.push({
      titulo,
      slug: slugificar(titulo),
      audio: audioCaminho ? await criarMidia(audioCaminho) : null,
      duracao: textoOpcional(registro.duracao),
      letra,
      letraHtml: markdownParaHtml(letra),
    });
  }

  const capaCaminho = textoOpcional(dados.capa);

  return {
    slug: slugificar(nome) || slugificar(caminho),
    nome,
    tipo,
    ano,
    data,
    capa: capaCaminho ? await criarMidia(capaCaminho) : null,
    faixas,
    links: lerLinks(dados.links),
    descricao,
    descricaoHtml: markdownParaHtml(descricao),
    privado: dados.privado === true,
  };
}

/** Ordena do mais recente ao mais antigo: `data` desc, `ano` desc, `slug` asc. */
export function ordenarPorRecencia(lancamentos: Lancamento[]): Lancamento[] {
  return [...lancamentos].sort((a, b) => {
    const da = a.data ?? `${a.ano}-12-31`;
    const db = b.data ?? `${b.ano}-12-31`;
    if (da !== db) return db.localeCompare(da);
    if (a.ano !== b.ano) return b.ano - a.ano;
    return a.slug.localeCompare(b.slug);
  });
}

export const releaseRepository: ReleaseRepository = {
  async list(): Promise<Lancamento[]> {
    const dir = join(DIR_CONTENT, 'discografia');
    return lerComAssinatura('discografia', dir, async () => {
      const arquivos = await listarArquivosMd(dir);
      const lancamentos: Lancamento[] = [];
      for (const caminho of arquivos) {
        let bruto: string;
        try {
  bruto = await readFile(caminho, 'utf8');
        } catch {
          continue;
        }
        const lancamento = await construirLancamento(caminho, bruto);
        if (lancamento && !lancamento.privado) lancamentos.push(lancamento);
      }
      return lancamentos;
    });
  },

  async getBySlug(slug: string): Promise<Lancamento | null> {
    const lancamentos = await releaseRepository.list();
    return lancamentos.find((l) => l.slug === slug) ?? null;
  },

  async listPorRecencia(): Promise<Lancamento[]> {
    return ordenarPorRecencia(await releaseRepository.list());
  },

  async upsert(lancamento: Lancamento): Promise<Lancamento> {
    const dir = join(DIR_CONTENT, 'discografia');
    await mkdir(dir, { recursive: true });

    const front = [
      '---',
      'formato: 1',
      `nome: ${JSON.stringify(lancamento.nome)}`,
      `tipo: ${lancamento.tipo}`,
      `ano: ${lancamento.ano}`,
    ];
    if (lancamento.data) front.push(`data: ${lancamento.data}`);
    if (lancamento.capa) front.push(`capa: ${lancamento.capa.caminho}`);
    if (lancamento.links.length) {
      front.push('links:');
      for (const link of lancamento.links) {
        front.push(`  - rotulo: ${JSON.stringify(link.rotulo)}`);
        front.push(`    url: ${JSON.stringify(link.url)}`);
      }
    }
    if (lancamento.faixas.length) {
      front.push('faixas:');
      for (const faixa of lancamento.faixas) {
        front.push(`  - titulo: ${JSON.stringify(faixa.titulo)}`);
        if (faixa.audio) front.push(`    audio: ${faixa.audio.caminho}`);
        if (faixa.duracao) front.push(`    duracao: ${JSON.stringify(faixa.duracao)}`);
      }
    }
    front.push('---', '', lancamento.descricao.trim(), '');

    for (const faixa of lancamento.faixas) {
      if (!faixa.letra) continue;
      front.push(`## Letra — ${faixa.titulo}`, '', faixa.letra.trim(), '');
    }

    await writeFile(join(dir, `${lancamento.slug}.md`), front.join('\n'), 'utf8');
    return lancamento;
  },

  async remove(slug: string): Promise<void> {
    await rm(join(DIR_CONTENT, 'discografia', `${slug}.md`), { force: true });
  },
};

export function faixasDeColecao(
  lancamentos: Lancamento[],
  referencias: string[],
): Array<{ lancamento: Lancamento; faixa: Faixa }> {
  const resultado: Array<{ lancamento: Lancamento; faixa: Faixa }> = [];
  for (const referencia of referencias) {
    const [slugLancamento, slugFaixa] = referencia.split('/');
    const lancamento = lancamentos.find((l) => l.slug === slugLancamento);
    const faixa = lancamento?.faixas.find((f) => f.slug === slugFaixa);
    if (lancamento && faixa) resultado.push({ lancamento, faixa });
  }
  return resultado;
}

export function listaDeFaixas(lancamentos: Lancamento[]): string[] {
  return lancamentos.flatMap((l) => l.faixas.map((f) => f.slug));
}

export { listaDeTexto };
