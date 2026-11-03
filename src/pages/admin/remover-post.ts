import type { APIRoute } from 'astro';
import { auditStore } from '~/lib/content/file-audit.store';
import { apagarPost } from '~/lib/content/file-post.repository';
import { commitar } from '~/lib/git/commit';
import { RAIZ } from '~/lib/content/cache';

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const slug = String(form.get('slug') ?? '').trim();
  if (!slug) return redirect('/admin/posts', 303);

  const arquivo = await apagarPost(slug);
  await auditStore.append({ usuario: 'artista', acao: 'remover', alvo: `post:${slug}` });
  if (arquivo) {
    await commitar(RAIZ, `conteudo: remove post "${slug}"`, [arquivo]);
  }
  return redirect('/admin/posts?ok=1', 303);
};
