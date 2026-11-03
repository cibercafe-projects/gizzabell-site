import type { APIRoute } from 'astro';
import { sessionStore } from '~/lib/content/file-session.store';
import { auditStore } from '~/lib/content/file-audit.store';
import { validarCredenciais } from '~/lib/auth/conta';
import { chaveLogin, estaBloqueado, registrarFalha, registrarSucesso } from '~/lib/auth/rate-limit';
import { serializarCookieSessao } from '~/lib/auth/session';

export const POST: APIRoute = async ({ request, redirect, url }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  const form = await request.formData();
  const usuario = String(form.get('usuario') ?? '').trim();
  const senha = String(form.get('senha') ?? '');
  const destinoBruto = String(form.get('destino') ?? '/admin');
  const destino = destinoBruto.startsWith('/admin') ? destinoBruto : '/admin';

  const chave = chaveLogin(usuario, ip);

  if (estaBloqueado(chave)) {
    await auditStore.append({ usuario: usuario || '(vazio)', acao: 'login_bloqueado', alvo: 'admin' });
    return redirect('/admin/login?erro=bloqueado', 303);
  }

  const valido = await validarCredenciais(usuario, senha);

  if (!valido) {
    registrarFalha(chave);
    await auditStore.append({ usuario: usuario || '(vazio)', acao: 'login_falho', alvo: 'admin' });
    return redirect('/admin/login?erro=credenciais', 303);
  }

  registrarSucesso(chave);
  const sessao = await sessionStore.create(usuario);
  await auditStore.append({ usuario, acao: 'login', alvo: 'admin' });

  const seguro = url.protocol === 'https:';
  return new Response(null, {
    status: 303,
    headers: {
      Location: destino,
      'Set-Cookie': serializarCookieSessao(sessao.id, sessao.expiraEm, seguro),
    },
  });
};
