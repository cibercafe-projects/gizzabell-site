import type { APIRoute } from 'astro';
import { sessionStore } from '~/lib/content/file-session.store';
import { serializarCookieLimpeza } from '~/lib/auth/session';
import { lerCookie, COOKIE_SESSAO } from '~/lib/auth/session';
import { auditStore } from '~/lib/content/file-audit.store';

export const POST: APIRoute = async ({ request }) => {
  const id = lerCookie(request.headers.get('cookie'), COOKIE_SESSAO);
  if (id) {
    const sessao = await sessionStore.get(id);
    if (sessao) await auditStore.append({ usuario: sessao.usuario, acao: 'logout', alvo: 'admin' });
    await sessionStore.destroy(id);
  }
  return new Response(null, {
    status: 303,
    headers: { Location: '/admin/login', 'Set-Cookie': serializarCookieLimpeza() },
  });
};
