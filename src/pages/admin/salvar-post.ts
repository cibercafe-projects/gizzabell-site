import type { APIRoute } from 'astro';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIR_FILES } from '~/lib/content/cache';
import { slugificar } from '~/lib/content/schema';
import { gravarPost } from '~/lib/content/file-post.repository';
import { auditStore } from '~/lib/content/file-audit.store';
import { commitar } from '~/lib/git/commit';
import { RAIZ } from '~/lib/content/cache';
import { criarMidia } from '~/lib/media/midia';
import type { Post } from '~/lib/content/types';

const LIMITE_IMAGEM = 5 * 1024 * 1024;
const LIMITE_VIDEO = 50 * 1024 * 1024;

const TIPOS_PERMITIDOS: Record<string, string> = {
  'image/webp': '.webp',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/avif': '.avif',
  'video/mp4': '.mp4',
};

function timestampAgora(): string {
  const agora = new Date();
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${p(agora.getDate())}-${p(agora.getMonth() + 1)}-${agora.getFullYear()}-${p(agora.getHours())}-${p(agora.getMinutes())}-${p(agora.getSeconds())}`;
}

async function salvarUploads(
  arquivos: File[],
  pasta: string,
): Promise<string[]> {
  const caminhos: string[] = [];
  if (!arquivos.length) return caminhos;

  const destino = join(DIR_FILES, 'pics', pasta);
  await mkdir(destino, { recursive: true });

  let indice = 1;
  for (const arquivo of arquivos) {
    if (!arquivo || typeof arquivo.arrayBuffer !== 'function') continue;
    const extensao = TIPOS_PERMITIDOS[arquivo.type];
    if (!extensao) continue;
    const limite = arquivo.type.startsWith('video/') ? LIMITE_VIDEO : LIMITE_IMAGEM;
    if (arquivo.size > limite) continue;

    const nome = `${String(indice).padStart(2, '0')}${extensao}`;
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    await writeFile(join(destino, nome), buffer);
    caminhos.push(`pics/${pasta}/${nome}`);
    indice += 1;
  }
  return caminhos;
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();

  const slug = String(form.get('slug') ?? '').trim();
  const nome = String(form.get('nome') ?? '').trim();
  const data = String(form.get('data') ?? '').trim();
  const categoria = String(form.get('categoria') ?? 'feed').trim();
  const descricao = String(form.get('descricao') ?? '');
  const posterBruto = String(form.get('poster') ?? '').trim();
  const tags = String(form.get('tags') ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const privado = form.get('privado') === '1';

  const midiasTexto = String(form.get('midias') ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!nome || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return redirect('/admin/posts?erro=Nome e data são obrigatórios', 303);
  }

  const pasta = String(form.get('pasta') ?? '').trim() || `${timestampAgora()}-${slugificar(nome)}`;

  const arquivos = form.getAll('arquivos').filter((v): v is File => v instanceof File);
  const enviadas = await salvarUploads(arquivos, pasta);
  const caminhos = [...midiasTexto, ...enviadas];

  const midias = [];
  for (const caminho of caminhos) {
    midias.push(await criarMidia(caminho));
  }

  const post: Post = {
    slug: slug || slugificar(nome),
    nome,
    data,
    categoria: categoria as Post['categoria'],
    pasta,
    midias,
    poster: posterBruto ? await criarMidia(posterBruto) : null,
    descricao,
    descricaoHtml: '',
    resumo: '',
    tags,
    privado,
    formato: midias.length > 1 ? 'carrossel' : midias.length === 1 ? 'foto' : 'foto',
    url: '',
    capa: midias[0] ?? null,
  };

  const arquivo = await gravarPost(post);
  await auditStore.append({
    usuario: 'artista',
    acao: slug ? 'editar' : 'criar',
    alvo: `post:${post.slug}`,
    detalhe: { nome, data, categoria, privado },
  });

  await commitar(RAIZ, `conteudo: ${slug ? 'edita' : 'cria'} post "${nome}"`, [
    arquivo,
    `content/${data.slice(0, 4)}/${data.slice(5, 7)}.md`,
    `content/privado/${data.slice(0, 4)}/${data.slice(5, 7)}.md`,
    `files/pics/${pasta}`,
  ]);

  return redirect('/admin/posts?ok=1', 303);
};
