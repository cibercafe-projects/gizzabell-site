export const COOKIE_SESSAO = 'gizzabell_sessao';
export const EXPIRA_SESSAO_HORAS = 8;

export function lerCookie(cookies: string | null, nome: string): string | null {
  if (!cookies) return null;
  for (const parte of cookies.split(';')) {
    const [chave, ...resto] = parte.trim().split('=');
    if (chave === nome) return decodeURIComponent(resto.join('='));
  }
  return null;
}

export function serializarCookieSessao(id: string, expiraEm: Date, seguro: boolean): string {
  const partes = [
    `${COOKIE_SESSAO}=${encodeURIComponent(id)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Expires=${expiraEm.toUTCString()}`,
  ];
  if (seguro) partes.push('Secure');
  return partes.join('; ');
}

export function serializarCookieLimpeza(): string {
  return `${COOKIE_SESSAO}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}
