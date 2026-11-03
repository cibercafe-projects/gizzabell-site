import type { APIRoute } from 'astro';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIR_FILES, RAIZ } from '~/lib/content/cache';
import { slugificar } from '~/lib/content/schema';
import { agendaRepository } from '~/lib/content/file-agenda.repository';
import { auditStore } from '~/lib/content/file-audit.store';
import { commitar } from '~/lib/git/commit';
import type { EventoAgenda, LinkExterno } from '~/lib/content/types';

const TIPOS_CARTAZ: Record<string, string> = {
  'image/webp': '.webp',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/avif': '.avif',
};

function lerLinks(bruto: string): LinkExterno[] {
  const links: LinkExterno[] = [];
  for (const linha of bruto.split(/\r?\n/)) {
    const [rotulo, url] = linha.split('|').map((v) => v.trim());
    if (!url) continue;
    links.push({ rotulo: rotulo || url, url });
  }
  return links;
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();

  const slug = String(form.get('slug') ?? '').trim();
  const titulo = String(form.get('titulo') ?? '').trim();
  const data = String(form.get('data') ?? '').trim();
  const local = String(form.get('local') ?? '').trim();
  const cidade = String(form.get('cidade') ?? '').trim();
  const descricao = String(form.get('descricao') ?? '');
  const links = lerLinks(String(form.get('links') ?? ''));
  const divulgarEmail = form.get('divulgar_email') === '1';

  if (!titulo || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return redirect('/admin/agenda?erro=Título e data são obrigatórios', 303);
  }

  let cartaz: { caminho: string; url: string; tipo: 'imagem'; largura: null; altura: null } | null = null;

  const arquivoCartaz = form.get('cartaz');
  if (arquivoCartaz instanceof File && arquivoCartaz.size > 0) {
    const extensao = TIPOS_CARTAZ[arquivoCartaz.type];
    if (extensao && arquivoCartaz.size <= 5 * 1024 * 1024) {
      const pasta = join(DIR_FILES, 'pics', 'agenda');
      await mkdir(pasta, { recursive: true });
      const nome = `${slugificar(titulo)}-${data}${extensao}`;
      const buffer = Buffer.from(await arquivoCartaz.arrayBuffer());
      await writeFile(join(pasta, nome), buffer);
      cartaz = {
        caminho: `pics/agenda/${nome}`,
        url: `/files/pics/agenda/${nome}`,
        tipo: 'imagem',
        largura: null,
        altura: null,
      };
    }
  }

  const evento: EventoAgenda = {
    slug: slug || slugificar(`${titulo}-${data}`),
    titulo,
    data,
    local,
    cidade,
    descricao,
    descricaoHtml: '',
    cartaz,
    links,
    divulgarEmail,
    futuro: data >= new Date().toISOString().slice(0, 10),
  };

  await agendaRepository.upsert(evento);
  await auditStore.append({
    usuario: 'artista',
    acao: slug ? 'editar' : 'criar',
    alvo: `evento:${evento.slug}`,
  });

  await commitar(RAIZ, `conteudo: ${slug ? 'edita' : 'cria'} evento "${titulo}"`, [
    `content/agenda/${evento.slug}.md`,
    'files/pics/agenda',
  ]);

  return redirect('/admin/agenda?ok=1', 303);
};
