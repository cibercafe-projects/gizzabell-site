import type { APIRoute } from 'astro';
import { postRepository } from '~/lib/content/file-post.repository';
import { counterStore } from '~/lib/content/file-counter.store';
import { permitirRequisicao } from '~/lib/auth/rate-limit';
import { ordenarPorData, ordenarPorPopularidade } from '~/lib/content/popularity';
import type { OrdemHome } from '~/lib/content/popularity';

export const GET: APIRoute = async ({ request, url }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (!permitirRequisicao(`ordem:${ip}`, 120)) {
    return new Response(JSON.stringify({ erro: { codigo: 'excesso_de_requisicoes' } }), {
      status: 429,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const bruto = url.searchParams.get('ordem');
  const ordem: OrdemHome = bruto === 'pasta' || bruto === 'popularidade' ? bruto : 'data';

  const posts = await postRepository.list();
  const ranking = await counterStore.ranking();
  const cliques = new Map(ranking.map((r) => [r.slug, r.cliques]));

  let slugs: string[];
  if (ordem === 'popularidade') {
    slugs = ordenarPorPopularidade(posts, cliques).map((p) => p.slug);
  } else if (ordem === 'pasta') {
    slugs = (await postRepository.orderByPasta(posts)).map((p) => p.slug);
  } else {
    slugs = ordenarPorData(posts).map((p) => p.slug);
  }

  return new Response(JSON.stringify({ ordem, slugs }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};
