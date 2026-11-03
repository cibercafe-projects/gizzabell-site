import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawn, execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const RAIZ = process.cwd();
const ENTRADA = join(RAIZ, 'dist', 'server', 'entry.mjs');
const PORTA = 4411;

let servidor: ReturnType<typeof spawn>;
let base = '';

beforeAll(async () => {
  if (!existsSync(ENTRADA)) {
    await exec('npm', ['run', 'build'], { cwd: RAIZ, timeout: 300_000 });
  }

  servidor = spawn(process.execPath, [ENTRADA], {
    cwd: RAIZ,
    env: { ...process.env, PORT: String(PORTA), HOST: '127.0.0.1' },
    stdio: 'ignore',
  });

  base = `http://127.0.0.1:${PORTA}`;
  for (let i = 0; i < 60; i++) {
    try {
      const resposta = await fetch(`${base}/`);
      if (resposta.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('servidor não subiu');
}, 300_000);

afterAll(() => {
  servidor?.kill();
});

describe('rotas públicas', () => {
  it('a home responde 200 e mostra o mosaico e o feed', async () => {
    const resposta = await fetch(`${base}/`);
    expect(resposta.status).toBe(200);
    const html = await resposta.text();
    expect(html).toContain('data-mosaico');
    expect(html).toContain('data-visualizacao="feed"');
  });

  it('a home declara a largura das imagens', async () => {
    const html = await (await fetch(`${base}/`)).text();
    const imagens = html.match(/<img[^>]*>/g) ?? [];
    expect(imagens.length).toBeGreaterThan(0);
    for (const imagem of imagens) {
      expect(imagem).toContain('width=');
    }
  });

  it('o menu tem os quatro links na ordem', async () => {
    const html = await (await fetch(`${base}/`)).text();
    const nav = /<nav[^>]*aria-label="Principal"[\s\S]*?<\/nav>/.exec(html)?.[0] ?? '';
    const hrefs = [...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toEqual(['/', '/timeline', '/agenda', '/discografia']);
  });

  it('a timeline não mostra posts de categoria feed', async () => {
    const html = await (await fetch(`${base}/timeline`)).text();
    // "Ensaio em casa" é categoria feed e não pode aparecer
    expect(html).not.toContain('Ensaio em casa');
    // "Sessão de estúdio" é categoria trabalhos e aparece
    expect(html).toContain('Sessão de estúdio');
    expect(html).toContain('Show na Casa Blue');
  });

  it('a agenda lista os eventos', async () => {
    const html = await (await fetch(`${base}/agenda`)).text();
    expect(html).toContain('Show na Casa Blue');
  });

  it('a discografia lista os lançamentos com tracklist e letra', async () => {
    const html = await (await fetch(`${base}/discografia`)).text();
    expect(html).toContain('EP Neon');

    const pagina = await (await fetch(`${base}/discografia/ep-neon`)).text();
    expect(pagina).toContain('Lost');
    expect(pagina).toContain('Letra');
  });

  it('post inexistente devolve 404', async () => {
    const resposta = await fetch(`${base}/post/nao-existe`);
    expect(resposta.status).toBe(404);
  });

  it('a mídia é servida com cache imutável e aceita Range', async () => {
    const resposta = await fetch(`${base}/files/pics/14-11-2026-18-30-45-show-casa-blue/01.webp`);
    expect(resposta.status).toBe(200);
    expect(resposta.headers.get('cache-control')).toContain('immutable');
    expect(resposta.headers.get('accept-ranges')).toBe('bytes');

    const parcial = await fetch(`${base}/files/pics/14-11-2026-18-30-45-show-casa-blue/01.webp`, {
      headers: { Range: 'bytes=0-99' },
    });
    expect(parcial.status).toBe(206);
  });

  it('a busca global encontra posts e rejeita termo curto', async () => {
    const ok = await fetch(`${base}/api/search?q=casa`);
    expect(ok.status).toBe(200);
    const dados = (await ok.json()) as { total: number };
    expect(dados.total).toBeGreaterThan(0);

    const curto = await fetch(`${base}/api/search?q=a`);
    expect(curto.status).toBe(400);
  });

  it('a ordem por popularidade devolve os slugs', async () => {
    const resposta = await fetch(`${base}/api/ordem?ordem=popularidade`);
    expect(resposta.status).toBe(200);
    const dados = (await resposta.json()) as { slugs: string[] };
    expect(dados.slugs.length).toBeGreaterThan(0);
  });
});

describe('área administrativa', () => {
  it('redireciona para o login sem sessão', async () => {
    const resposta = await fetch(`${base}/admin`, { redirect: 'manual' });
    expect(resposta.status).toBe(303);
    expect(resposta.headers.get('location')).toContain('/admin/login');
  });

  it('recusa senha errada', async () => {
    const resposta = await fetch(`${base}/admin/entrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'usuario=artista&senha=errada',
      redirect: 'manual',
    });
    expect(resposta.status).toBe(303);
    expect(resposta.headers.get('location')).toContain('erro=credenciais');
  });
});

describe('contador de popularidade', () => {
  it('registra um clique e rejeita post inexistente', async () => {
    const ok = await fetch(`${base}/api/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post: 'show-na-casa-blue' }),
    });
    expect(ok.status).toBe(204);

    const invalido = await fetch(`${base}/api/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post: 'nao-existe' }),
    });
    expect(invalido.status).toBe(400);
  });
});
