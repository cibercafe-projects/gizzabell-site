import type { APIRoute } from 'astro';
import { agendaRepository } from '~/lib/content/file-agenda.repository';
import { auditStore } from '~/lib/content/file-audit.store';
import { commitar } from '~/lib/git/commit';
import { RAIZ } from '~/lib/content/cache';

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const slug = String(form.get('slug') ?? '').trim();
  if (!slug) return redirect('/admin/agenda', 303);

  await agendaRepository.remove(slug);
  await auditStore.append({ usuario: 'artista', acao: 'remover', alvo: `evento:${slug}` });
  await commitar(RAIZ, `conteudo: remove evento "${slug}"`, [`content/agenda/${slug}.md`]);
  return redirect('/admin/agenda?ok=1', 303);
};
