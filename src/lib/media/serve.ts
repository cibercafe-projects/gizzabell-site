import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, normalize, sep } from 'node:path';
import { DIR_FILES } from '~/lib/content/cache';
import { mimeDe } from '~/lib/media/image-size';

export interface ArquivoEncontrado {
  caminho: string;
  tamanho: number;
  mtimeMs: number;
}

/** Resolve um caminho pedido em `/files/...` dentro de `files/`, bloqueando travessia. */
export function resolverEmFiles(caminhoUrl: string): string | null {
  const limpo = decodeURIComponent(caminhoUrl).replace(/^\/+/, '');
  if (limpo === '') return null;

  const alvo = normalize(join(DIR_FILES, limpo));
  const base = normalize(DIR_FILES);
  if (alvo !== base && !alvo.startsWith(base + sep)) return null;
  return alvo;
}

export async function encontrarArquivo(caminhoUrl: string): Promise<ArquivoEncontrado | null> {
  const caminho = resolverEmFiles(caminhoUrl);
  if (!caminho) return null;
  try {
    const info = await stat(caminho);
    if (!info.isFile()) return null;
    return { caminho, tamanho: info.size, mtimeMs: info.mtimeMs };
  } catch {
    return null;
  }
}

export function etagDe(mtimeMs: number, tamanho: number): string {
  return `W/"${Math.floor(mtimeMs).toString(16)}-${tamanho.toString(16)}"`;
}

/**
 * Resposta para requisição de mídia com suporte a Range (necessário para
 * `seek` de vídeo e para o Safari reproduzir).
 */
export function responderMidia(
  arquivo: ArquivoEncontrado,
  cabecalhos: Headers,
  intervalo?: string | null,
): Response {
  const tipo = mimeDe(arquivo.caminho);
  const etag = etagDe(arquivo.mtimeMs, arquivo.tamanho);
  const base: Record<string, string> = {
    'Content-Type': tipo,
    'Accept-Ranges': 'bytes',
    ETag: etag,
    'Last-Modified': new Date(arquivo.mtimeMs).toUTCString(),
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  };

  const condicional = cabecalhos.get('if-none-match');
  if (condicional === etag) {
    return new Response(null, { status: 304, headers: base });
  }

  const tamanho = arquivo.tamanho;
  const partida = analisarIntervalo(intervalo, tamanho);

  if (partida === 'invalido') {
    return new Response(null, {
      status: 416,
      headers: { ...base, 'Content-Range': `bytes */${tamanho}` },
    });
  }

  if (partida) {
    const stream = createReadStream(arquivo.caminho, {
      start: partida.inicio,
      end: partida.fim,
    });
    return new Response(stream as unknown as ReadableStream, {
      status: 206,
      headers: {
        ...base,
        'Content-Range': `bytes ${partida.inicio}-${partida.fim}/${tamanho}`,
        'Content-Length': String(partida.fim - partida.inicio + 1),
      },
    });
  }

  const stream = createReadStream(arquivo.caminho);
  return new Response(stream as unknown as ReadableStream, {
    status: 200,
    headers: { ...base, 'Content-Length': String(tamanho) },
  });
}

interface Intervalo {
  inicio: number;
  fim: number;
}

export function analisarIntervalo(cabecalho: string | null | undefined, tamanho: number): Intervalo | null | 'invalido' {
  if (!cabecalho) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(cabecalho.trim());
  if (!m) return null;

  const inicioTexto = m[1] ?? '';
  const fimTexto = m[2] ?? '';

  if (inicioTexto === '' && fimTexto === '') return 'invalido';

  let inicio: number;
  let fim: number;

  if (inicioTexto === '') {
    const suffix = Number(fimTexto);
    if (!Number.isFinite(suffix) || suffix <= 0) return 'invalido';
    inicio = Math.max(0, tamanho - suffix);
    fim = tamanho - 1;
  } else {
    inicio = Number(inicioTexto);
    fim = fimTexto === '' ? tamanho - 1 : Number(fimTexto);
    if (!Number.isFinite(inicio) || !Number.isFinite(fim)) return 'invalido';
    if (inicio > fim || inicio >= tamanho) return 'invalido';
    fim = Math.min(fim, tamanho - 1);
  }

  return { inicio, fim };
}
