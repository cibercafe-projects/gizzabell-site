import type { APIContext } from 'astro';
import { sessionStore } from '~/lib/content/file-session.store';
import { COOKIE_SESSAO, lerCookie } from '~/lib/auth/session';

export const CAMINHO_ADMIN = '/admin';

/** Rotas do backoffice accesibles sem sessão. */
export const ROTAS_PUBLICAS_ADMIN = [`${CAMINHO_ADMIN}/login`, `${CAMINHO_ADMIN}/entrar`];

export function ehRotaAdmin(caminho: string): boolean {
  return caminho === CAMINHO_ADMIN || caminho.startsWith(`${CAMINHO_ADMIN}/`);
}

export async function sessaoAtual(context: APIContext): Promise<{ id: string; usuario: string } | null> {
  const id = lerCookie(context.request.headers.get('cookie'), COOKIE_SESSAO);
  if (!id) return null;
  const sessao = await sessionStore.get(id);
  if (!sessao) return null;
  return { id: sessao.id, usuario: sessao.usuario };
}

/** Redireciona para o login quando não há sessão válida. */
export async function exigirSessao(context: APIContext): Promise<Response | null> {
  if (!ehRotaAdmin(context.url.pathname)) return null;
  if (ROTAS_PUBLICAS_ADMIN.includes(context.url.pathname)) return null;

  const sessao = await sessaoAtual(context);
  if (!sessao) {
    const destino = encodeURIComponent(context.url.pathname + context.url.search);
    return context.redirect(`${CAMINHO_ADMIN}/login?destino=${destino}`, 303);
  }
  return null;
}
