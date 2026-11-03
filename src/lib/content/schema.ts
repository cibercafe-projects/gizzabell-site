import { CATEGORIAS, type Categoria } from '~/lib/content/types';

export class ErroValidacao extends Error {
  readonly arquivo: string;
  readonly linha: number | null;
  readonly campo: string;

  constructor(arquivo: string, linha: number | null, campo: string, mensagem: string) {
    super(`${arquivo}${linha ? `:${linha}` : ''} — ${campo}: ${mensagem}`);
    this.name = 'ErroValidacao';
    this.arquivo = arquivo;
    this.linha = linha;
    this.campo = campo;
  }
}

export const RE_PASTA = /^\d{2}-\d{2}-\d{4}-\d{2}-\d{2}-\d{2}(?:-[a-z0-9-]+)?$/;

export function ehDataIso(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano = 0, mes = 1, dia = 1] = valor.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

export function ehCategoria(valor: unknown): valor is Categoria {
  return typeof valor === 'string' && (CATEGORIAS as readonly string[]).includes(valor);
}

export function ehSlug(valor: unknown): valor is string {
  return typeof valor === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(valor);
}

export function texto(valor: unknown, campo: string, arquivo: string, linha: number | null): string {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new ErroValidacao(arquivo, linha, campo, 'é obrigatório');
  }
  return valor.trim();
}

export function textoOpcional(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function listaDeTexto(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((v): v is string => typeof v === 'string').map((v) => v.trim());
}

export function numeroInteiro(valor: unknown, campo: string, arquivo: string, linha: number | null): number {
  const n = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new ErroValidacao(arquivo, linha, campo, 'deve ser um número inteiro');
  }
  return n;
}

/** Remove acento, baixa a caixa e troca tudo que não for letra/número por hífen. */
export function slugificar(entrada: string): string {
  return entrada
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Remove acento e mantém a busca independente de caixa e acento. */
export function normalizar(entrada: string): string {
  return entrada.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
