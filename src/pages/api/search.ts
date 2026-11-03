import type { APIRoute } from 'astro';
import { postRepository } from '~/lib/content/file-post.repository';
import { agendaRepository } from '~/lib/content/file-agenda.repository';
import { releaseRepository } from '~/lib/content/file-release.repository';
import { permitirRequisicao } from '~/lib/auth/rate-limit';
import { normalizar } from '~/lib/content/schema';

export const GET: APIRoute = async ({ request, url }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (!permitirRequisicao(`busca:${ip}`, 120)) {
    return new Response(JSON.stringify({ erro: { codigo: 'excesso_de_requisicoes' } }), {
      status: 429,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const termo = (url.searchParams.get('q') ?? '').trim();
  if (termo.length < 2) {
    return new Response(
      JSON.stringify({ erro: { codigo: 'termo_curto', mensagem: 'Digite ao menos 2 caracteres.' } }),
      { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
    );
  }

  const limite = Math.min(30, Math.max(1, Number(url.searchParams.get('limite') ?? 10)));
  const alvo = normalizar(termo);
  const contem = (texto: string): boolean => normalizar(texto).includes(alvo);

  const resultados: Array<{ tipo: string; titulo: string; resumo: string; url: string }> = [];

  const posts = await postRepository.list();
  for (const post of posts) {
    if (contem(post.nome) || contem(post.descricao) || post.tags.some((tag) => contem(tag))) {
      resultados.push({
        tipo: 'post',
        titulo: post.nome,
        resumo: post.resumo,
        url: post.url,
      });
    }
  }

  const eventos = await agendaRepository.list();
  for (const evento of eventos) {
    if (contem(evento.titulo) || contem(evento.descricao) || contem(evento.local)) {
      resultados.push({
        tipo: 'evento',
        titulo: evento.titulo,
        resumo: `${evento.data}${evento.local ? ` · ${evento.local}` : ''}`,
        url: '/agenda',
      });
    }
  }

  const lancamentos = await releaseRepository.list();
  for (const lancamento of lancamentos) {
    if (contem(lancamento.nome) || contem(lancamento.descricao)) {
      resultados.push({
        tipo: 'lancamento',
        titulo: lancamento.nome,
        resumo: `${lancamento.tipo} · ${lancamento.ano} · ${lancamento.faixas.length} faixas`,
        url: `/discografia/${lancamento.slug}`,
      });
    }
    for (const faixa of lancamento.faixas) {
      if (contem(faixa.titulo) || contem(faixa.letra)) {
        resultados.push({
          tipo: 'faixa',
          titulo: `${faixa.titulo} — ${lancamento.nome}`,
          resumo: faixa.letra ? faixa.letra.replace(/\s+/g, ' ').slice(0, 120) : 'Letra indisponível',
          url: `/discografia/${lancamento.slug}#faixa-${faixa.slug}`,
        });
      }
    }
  }

  return new Response(JSON.stringify({ termo, total: resultados.length, resultados: resultados.slice(0, limite) }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};
