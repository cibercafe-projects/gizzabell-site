import { describe, expect, it } from 'vitest';
import { releaseRepository, ordenarPorRecencia, separarLetras } from '~/lib/content/file-release.repository';
import type { Lancamento } from '~/lib/content/types';

function lancamento(slug: string, ano: number, data: string | null): Lancamento {
  return {
    slug,
    nome: slug,
    tipo: 'ep',
    ano,
    data,
    capa: null,
    faixas: [],
    links: [],
    descricao: '',
    descricaoHtml: '',
    privado: false,
  };
}

describe('ordem de recência dos lançamentos', () => {
  it('ordena do mais novo ao mais antigo pela data', () => {
    const lista = [
      lancamento('antigo', 2024, '2024-03-01'),
      lancamento('novo', 2026, '2026-11-20'),
      lancamento('meio', 2025, '2025-08-10'),
    ];
    expect(ordenarPorRecencia(lista).map((l) => l.slug)).toEqual(['novo', 'meio', 'antigo']);
  });

  it('usa o ano quando não há data', () => {
    const lista = [lancamento('a', 2024, null), lancamento('b', 2026, null)];
    expect(ordenarPorRecencia(lista).map((l) => l.slug)).toEqual(['b', 'a']);
  });

  it('desempata pelo slug', () => {
    const lista = [lancamento('zeta', 2026, '2026-01-01'), lancamento('alfa', 2026, '2026-01-01')];
    expect(ordenarPorRecencia(lista).map((l) => l.slug)).toEqual(['alfa', 'zeta']);
  });
});

describe('letras do lançamento', () => {
  it('separa a descrição das seções de letra', () => {
    const corpo = ['Descrição do EP.', '', '## Letra — Lost', '', 'Primeiro verso', '', '## Letra — Halo', '', 'Segundo verso'].join('\n');
    const { descricao, letras } = separarLetras(corpo);
    expect(descricao).toBe('Descrição do EP.');
    expect(letras.get('Lost')).toBe('Primeiro verso');
    expect(letras.get('Halo')).toBe('Segundo verso');
  });
});

describe('repositório de lançamentos', () => {
  it('lê o lançamento de exemplo com faixas e letras', async () => {
    const lancamentos = await releaseRepository.list();
    const neon = lancamentos.find((l) => l.slug === 'ep-neon');
    expect(neon).toBeDefined();
    expect(neon?.faixas).toHaveLength(2);
    expect(neon?.faixas[0]?.letra).toContain('neon');
  });

  it('ordena por recência', async () => {
    const lancamentos = await releaseRepository.listPorRecencia();
    const datas = lancamentos.map((l) => l.data ?? `${l.ano}-12-31`);
    expect([...datas].sort().reverse()).toEqual(datas);
  });
});
