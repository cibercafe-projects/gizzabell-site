import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { DIR_CONTENT, invalidar, lerComAssinatura, lerComCache } from '~/lib/content/cache';
import { markdownParaHtml, markdownParaTexto, resumo, dividirDocumentos, separarFrontmatter } from '~/lib/markdown';
import { criarMidia } from '~/lib/media/midia';
import type { Categoria, Midia, Post } from '~/lib/content/types';
import { ehDataIso, ehCategoria, listaDeTexto, slugificar } from '~/lib/content/schema';
import type { OpcoesPost, PostRepository } from '~/lib/content/repository';

async function listarArquivos(dir: string): Promise<string[]> {
  try {
    const entradas = await readdir(dir, { withFileTypes: true });
    return entradas
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => join(dir, e.name))
      .sort();
  } catch {
    return [];
  }
}

async function listarArvoreMeses(raiz: string): Promise<string[]> {
  const arquivos: string[] = [];
  let anos: string[];
  try {
    anos = (await readdir(raiz, { withFileTypes: true }))
      .filter((e) => e.isDirectory() && /^\d{4}$/.test(e.name))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
  for (const ano of anos) {
    arquivos.push(...(await listarArquivos(join(raiz, ano))));
  }
  return arquivos;
}

async function construirPost(
  caminho: string,
  frontmatter: string,
  corpo: string,
  privadoPorCaminho: boolean,
): Promise<Post | null> {
  const { dados } = separarFrontmatter(frontmatter, corpo);
  const nome = typeof dados.nome === 'string' ? dados.nome.trim() : '';
  if (!nome) return null;

  const data = typeof dados.data === 'string' ? dados.data : '';
  const categoria = (dados.categoria ?? 'feed') as Categoria;
  const pasta = typeof dados.pasta === 'string' ? dados.pasta.trim() : '';
  const caminhosMidias = listaDeTexto(dados.midias);

  const midias: Midia[] = [];
  for (const caminho of caminhosMidias) {
    midias.push(await criarMidia(caminho));
  }

  const posterCaminho = typeof dados.poster === 'string' ? dados.poster.trim() : '';
  const poster = posterCaminho ? await criarMidia(posterCaminho) : null;

  const privado = privadoPorCaminho || dados.privado === true;
  const slug = slugificar(nome) || pasta || 'post';

  const descricao = corpo.trim();
  const descricaoHtml = markdownParaHtml(descricao);
  const texto = markdownParaTexto(descricao);

  const formato =
    midias.length === 0 ? 'foto' : midias.length === 1 && midias[0]?.tipo === 'video' ? 'video' : midias.length === 1 ? 'foto' : 'carrossel';

  const capa = midias[0] ?? poster;

  return {
    slug,
    nome,
    data: ehDataIso(data) ? data : '',
    categoria: ehCategoria(categoria) ? categoria : 'feed',
    pasta,
    midias,
    poster,
    descricao,
    descricaoHtml,
    resumo: resumo(texto),
    tags: listaDeTexto(dados.tags),
    privado,
    formato,
    url: `/post/${slug}`,
    capa,
  };
}

async function carregarTodos(incluirPrivados: boolean): Promise<Post[]> {
  const arquivos = [
    ...(await listarArvoreMeses(join(DIR_CONTENT))),
    ...(await listarArvoreMeses(join(DIR_CONTENT, 'privado'))),
  ];

  const posts: Post[] = [];
  const slugsUsados = new Map<string, number>();

  for (const caminho of arquivos) {
    const privadoPorCaminho = caminho.replace(/\\/g, '/').includes('/privado/');
    if (privadoPorCaminho && !incluirPrivados) continue;

    let bruto: string;
    try {
  bruto = await readFile(caminho, 'utf8');
    } catch {
      continue;
    }

    for (const documento of dividirDocumentos(bruto)) {
      const post = await construirPost(
        caminho,
        documento.frontmatter,
        documento.corpo,
        privadoPorCaminho,
      );
      if (!post) continue;

      const n = slugsUsados.get(post.slug) ?? 0;
      slugsUsados.set(post.slug, n + 1);
      if (n > 0) post.slug = `${post.slug}-${n + 1}`;

      posts.push(post);
    }
  }

  return posts;
}

export async function gravarPost(post: Post): Promise<string> {
  const privado = post.privado;
  const base = privado ? join(DIR_CONTENT, 'privado') : DIR_CONTENT;
  const [ano = '1970', mes = '01'] = (post.data || '1970-01').split('-');
  const dir = join(base, ano);
  const arquivo = join(dir, `${mes}.md`);

  await mkdir(dir, { recursive: true });

  let conteudo: string;
  try {
  conteudo = await readFile(arquivo, 'utf8');
  } catch {
    conteudo = '';
  }

  const documentos = dividirDocumentos(conteudo).filter(
    (documento) => slugDoFrontmatter(documento.frontmatter) !== post.slug,
  );

  const front = [
    'formato: 1',
    `nome: ${JSON.stringify(post.nome)}`,
    `data: ${post.data}`,
    `categoria: ${post.categoria}`,
    `pasta: ${post.pasta}`,
  ];
  if (post.poster) front.push(`poster: ${post.poster.caminho}`);
  if (post.tags.length) {
    front.push('tags:');
    for (const tag of post.tags) front.push(`  - ${JSON.stringify(tag)}`);
  }
  front.push('midias:');
  for (const midia of post.midias) front.push(`  - ${midia.caminho}`);

  const novoConteudo = [
    ...documentos.map(
      (documento) => `---\n${documento.frontmatter.trim()}\n---\n${documento.corpo.trim()}`,
    ),
    `---\n${front.join('\n')}\n---\n${post.descricao.trim()}`,
  ].join('\n');

  await writeFile(arquivo, `${novoConteudo}\n`, 'utf8');
  invalidar('posts');
  return arquivo;
}

export async function apagarPost(slug: string): Promise<string | null> {
  const posts = await postRepository.list({ incluirPrivados: true });
  const post = posts.find((p) => p.slug === slug);
  if (!post) return null;

  const base = post.privado ? join(DIR_CONTENT, 'privado') : DIR_CONTENT;
  const [ano = '1970', mes = '01'] = (post.data || '1970-01').split('-');
  const arquivo = join(base, ano, `${mes}.md`);

  let conteudo: string;
  try {
  conteudo = await readFile(arquivo, 'utf8');
  } catch {
    return null;
  }

  const restantes = dividirDocumentos(conteudo).filter(
    (documento) => slugDoFrontmatter(documento.frontmatter) !== slug,
  );
  if (restantes.length === 0) {
    await rm(arquivo, { force: true });
  } else {
    const texto = restantes
      .map((documento) => `---\n${documento.frontmatter.trim()}\n---\n${documento.corpo.trim()}`)
      .join('\n');
    await writeFile(arquivo, `${texto}\n`, 'utf8');
  }

  invalidar('posts');
  return arquivo;
}

function slugDoFrontmatter(frontmatter: string): string {
  const { dados } = separarFrontmatter(frontmatter);
  const nome = typeof dados.nome === 'string' ? dados.nome.trim() : '';
  const pasta = typeof dados.pasta === 'string' ? dados.pasta.trim() : '';
  return slugificar(nome) || pasta;
}

export const postRepository: PostRepository = {
  async list(opts: OpcoesPost = {}): Promise<Post[]> {
    const todos = await lerComAssinatura('posts', DIR_CONTENT, () => carregarTodos(true));
    return opts.incluirPrivados ? todos : todos.filter((p) => !p.privado);
  },

  async getBySlug(slug: string, opts: OpcoesPost = {}): Promise<Post | null> {
    const posts = await postRepository.list(opts);
    return posts.find((p) => p.slug === slug) ?? null;
  },

  async orderByPasta(posts: Post[]): Promise<Post[]> {
    const ordem = await lerComCache('indice-pastas', join(DIR_CONTENT, 'index.md'), async (bruto) => {
      const { dados } = separarFrontmatter(bruto);
      return listaDeTexto(dados.pastas);
    });

    const posicao = new Map<string, number>();
    ordem.forEach((pasta, i) => posicao.set(pasta, i));

    return [...posts].sort((a, b) => {
      const pa = posicao.get(a.pasta);
      const pb = posicao.get(b.pasta);
      if (pa !== undefined && pb !== undefined && pa !== pb) return pa - pb;
      if (pa !== undefined && pb === undefined) return -1;
      if (pa === undefined && pb !== undefined) return 1;
      if (a.pasta !== b.pasta) return a.pasta.localeCompare(b.pasta);
      return b.data.localeCompare(a.data);
    });
  },
};
