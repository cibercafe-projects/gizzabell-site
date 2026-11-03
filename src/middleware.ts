import { defineMiddleware } from 'astro:middleware';
import { exigirSessao } from '~/lib/auth/guard';
import { encontrarArquivo, responderMidia } from '~/lib/media/serve';

export const onRequest = defineMiddleware(async (context, next) => {
  const caminho = context.url.pathname;

  if (caminho.startsWith('/files/')) {
    const arquivo = await encontrarArquivo(caminho.slice('/files/'.length));
    if (!arquivo) return new Response('Não encontrado', { status: 404 });
    return responderMidia(arquivo, context.request.headers, context.request.headers.get('range'));
  }

  const bloqueio = await exigirSessao(context);
  if (bloqueio) return bloqueio;

  return next();
});
