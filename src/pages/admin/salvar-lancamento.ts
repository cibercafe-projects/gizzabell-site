import type { APIRoute } from 'astro';
import { releaseRepository } from '~/lib/content/file-release.repository';
import { auditStore } from '~/lib/content/file-audit.store';
import { commitar } from '~/lib/git/commit';
import { RAIZ } from '~/lib/content/cache';
import { criarMidia } from '~/lib/media/midia';
import { slugificar } from '~/lib/content/schema';
import type { Faixa, Lancamento, TipoLancamento } from '~/lib/content/types';

const TIPOS: TipoLancamento[] = ['album', 'ep', 'single', 'compilacao'];

function lerFaixas(bruto: string): Array<{ titulo: string; audio: string; duracao: string; letra: string }> {
  const faixas: Array<{ titulo: string; audio: string; duracao: string; letra: string }> = [];
  for (const linha of bruto.split(/\r?\n/)) {
    if (!linha.trim()) continue;
    const partes = linha.split('|').map((p) => p.trim());
    const titulo = partes[0] ?? '';
    if (!titulo) continue;
    faixas.push({
      titulo,
      audio: partes[1] ?? '',
      duracao: partes[2] ?? '',
      letra: (partes.slice(3).join('|') ?? '').trim(),
    });
  }
  return faixas;
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();

  const slug = String(form.get('slug') ?? '').trim();
  const nome = String(form.get('nome') ?? '').trim();
  const tipoBruto = String(form.get('tipo') ?? 'ep') as TipoLancamento;
  const ano = Number(form.get('ano') ?? 0);
  const data = String(form.get('data') ?? '').trim();
  const capa = String(form.get('capa') ?? '').trim();
  const descricao = String(form.get('descricao') ?? '');
  const linhasFaixas = lerFaixas(String(form.get('faixas') ?? ''));

  if (!nome || !ano) {
    return redirect('/admin/discografia?erro=Nome e ano são obrigatórios', 303);
  }

  const tipo = TIPOS.includes(tipoBruto) ? tipoBruto : 'ep';

  const faixas: Faixa[] = [];
  for (const linha of linhasFaixas) {
    faixas.push({
      titulo: linha.titulo,
      slug: slugificar(linha.titulo),
      audio: linha.audio ? await criarMidia(linha.audio) : null,
      duracao: linha.duracao,
      letra: linha.letra,
      letraHtml: '',
    });
  }

  const lancamento: Lancamento = {
    slug: slug || slugificar(nome),
    nome,
    tipo,
    ano,
    data: data || null,
    capa: capa ? await criarMidia(capa) : null,
    faixas,
    links: [],
    descricao,
    descricaoHtml: '',
    privado: false,
  };

  await releaseRepository.upsert(lancamento);
  await auditStore.append({
    usuario: 'artista',
    acao: slug ? 'editar' : 'criar',
    alvo: `lancamento:${lancamento.slug}`,
  });

  await commitar(RAIZ, `conteudo: ${slug ? 'edita' : 'cria'} lancamento "${nome}"`, [
    `content/discografia/${lancamento.slug}.md`,
  ]);

  return redirect('/admin/discografia?ok=1', 303);
};
