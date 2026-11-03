import type { APIRoute } from 'astro';
import { releaseRepository } from '~/lib/content/file-release.repository';
import { auditStore } from '~/lib/content/file-audit.store';
import { commitar } from '~/lib/git/commit';
import { RAIZ } from '~/lib/content/cache';

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const slug = String(form.get('slug') ?? '').trim();
  if (!slug) return redirect('/admin/discografia', 303);

  await releaseRepository.remove(slug);
  await auditStore.append({ usuario: 'artista', acao: 'remover', alvo: `lancamento:${slug}` });
  await commitar(RAIZ, `conteudo: remove lancamento "${slug}"`, [`content/discografia/${slug}.md`]);
  return redirect('/admin/discografia?ok=1', 303);
};
