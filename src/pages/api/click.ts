import type { APIRoute } from 'astro';
import { postRepository } from '~/lib/content/file-post.repository';
import { counterStore } from '~/lib/content/file-counter.store';
import { permitirRequisicao } from '~/lib/auth/rate-limit';

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (!permitirRequisicao(`click:${ip}`, 120)) {
    return new Response(null, { status: 429 });
  }

  let slug: string;
  try {
    const tipo = request.headers.get('content-type') ?? '';
    if (tipo.includes('application/json')) {
      const corpo = (await request.json()) as { post?: unknown };
      slug = typeof corpo.post === 'string' ? corpo.post : '';
    } else {
      const form = await request.formData();
      slug = typeof form.get('post') === 'string' ? String(form.get('post')) : '';
    }
  } catch {
    slug = '';
  }

  if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
    return new Response(JSON.stringify({ erro: { codigo: 'post_invalido' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const post = await postRepository.getBySlug(slug);
  if (!post) {
    return new Response(JSON.stringify({ erro: { codigo: 'post_invalido' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  await counterStore.increment(slug);
  return new Response(null, { status: 204 });
};
