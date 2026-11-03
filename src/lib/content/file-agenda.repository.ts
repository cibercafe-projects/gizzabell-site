import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIR_CONTENT } from '~/lib/content/cache';
import { markdownParaHtml, separarArquivo, separarFrontmatter } from '~/lib/markdown';
import { criarMidia } from '~/lib/media/midia';
import { slugificar, textoOpcional } from '~/lib/content/schema';
import type { EventoAgenda, LinkExterno } from '~/lib/content/types';
import type { AgendaRepository } from '~/lib/content/repository';
import { lerComAssinatura } from '~/lib/content/cache';
import { listarArquivosMd } from '~/lib/content/util';

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

async function construirEvento(caminho: string, bruto: string): Promise<EventoAgenda | null> {
  const { frontmatter, corpo } = separarArquivo(bruto);
  const { dados } = separarFrontmatter(frontmatter, corpo);
  const titulo = textoOpcional(dados.titulo);
  if (!titulo) return null;

  const data = textoOpcional(dados.data);
  const slug = slugificar(`${titulo}-${data}`) || slugificar(caminho);
  const cartazCaminho = textoOpcional(dados.cartaz);

  const hoje = new Date().toISOString().slice(0, 10);

  return {
    slug,
    titulo,
    data,
    local: textoOpcional(dados.local),
    cidade: textoOpcional(dados.cidade),
    descricao: corpo.trim(),
    descricaoHtml: markdownParaHtml(corpo.trim()),
    cartaz: cartazCaminho ? await criarMidia(cartazCaminho) : null,
    links: lerLinks(dados.links),
    divulgarEmail: dados.divulgar_email === true,
    futuro: data >= hoje,
  };
}

export const agendaRepository: AgendaRepository = {
  async list(): Promise<EventoAgenda[]> {
    const dir = join(DIR_CONTENT, 'agenda');
    return lerComAssinatura('agenda', dir, async () => {
      const arquivos = await listarArquivosMd(dir);
      const eventos: EventoAgenda[] = [];
      for (const caminho of arquivos) {
        let bruto: string;
        try {
  bruto = await readFile(caminho, 'utf8');
        } catch {
          continue;
        }
        const evento = await construirEvento(caminho, bruto);
        if (evento) eventos.push(evento);
      }
      return eventos.sort((a, b) => a.data.localeCompare(b.data));
    });
  },

  async getBySlug(slug: string): Promise<EventoAgenda | null> {
    const eventos = await agendaRepository.list();
    return eventos.find((e) => e.slug === slug) ?? null;
  },

  async upsert(evento: EventoAgenda): Promise<EventoAgenda> {
    const dir = join(DIR_CONTENT, 'agenda');
    await mkdir(dir, { recursive: true });
    const front = [
      '---',
      'formato: 1',
      `titulo: ${JSON.stringify(evento.titulo)}`,
      `data: ${evento.data}`,
    ];
    if (evento.local) front.push(`local: ${JSON.stringify(evento.local)}`);
    if (evento.cidade) front.push(`cidade: ${JSON.stringify(evento.cidade)}`);
    if (evento.cartaz) front.push(`cartaz: ${evento.cartaz.caminho}`);
    front.push(`divulgar_email: ${evento.divulgarEmail ? 'true' : 'false'}`);
    if (evento.links.length) {
      front.push('links:');
      for (const link of evento.links) {
        front.push(`  - rotulo: ${JSON.stringify(link.rotulo)}`);
        front.push(`    url: ${JSON.stringify(link.url)}`);
      }
    }
    front.push('---', '', evento.descricao.trim(), '');

    await writeFile(join(dir, `${evento.slug}.md`), front.join('\n'), 'utf8');
    return evento;
  },

  async remove(slug: string): Promise<void> {
    await rm(join(DIR_CONTENT, 'agenda', `${slug}.md`), { force: true });
  },
};

