import { open } from 'node:fs/promises';

export interface Dimensao {
  largura: number;
  altura: number;
}

const EXTENSAO_IMAGEM = new Set(['.webp', '.jpg', '.jpeg', '.png', '.avif', '.gif']);
const EXTENSAO_VIDEO = new Set(['.mp4', '.m4v', '.webm', '.mov']);
const EXTENSAO_AUDIO = new Set(['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac']);

export function extensao(caminho: string): string {
  const ponto = caminho.lastIndexOf('.');
  return ponto === -1 ? '' : caminho.slice(ponto).toLowerCase();
}

export function ehImagem(caminho: string): boolean {
  return EXTENSAO_IMAGEM.has(extensao(caminho));
}

export function ehVideo(caminho: string): boolean {
  return EXTENSAO_VIDEO.has(extensao(caminho));
}

export function ehAudio(caminho: string): boolean {
  return EXTENSAO_AUDIO.has(extensao(caminho));
}

export type TipoMidia = 'imagem' | 'video' | 'audio';

export function tipoMidia(caminho: string): TipoMidia {
  if (ehVideo(caminho)) return 'video';
  if (ehAudio(caminho)) return 'audio';
  return 'imagem';
}

export const TIPOS_MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

export function mimeDe(caminho: string): string {
  return TIPOS_MIME[extensao(caminho)] ?? 'application/octet-stream';
}

/** Lê largura e altura do cabeçalho do arquivo, sem dependência nativa. */
export async function lerDimensoes(caminhoAbsoluto: string): Promise<Dimensao | null> {
  let handle;
  try {
    handle = await open(caminhoAbsoluto, 'r');
    const buffer = Buffer.alloc(64 * 1024);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const dados = buffer.subarray(0, bytesRead);

    const png = dimensaoPng(dados);
    if (png) return png;

    const jpeg = dimensaoJpeg(dados);
    if (jpeg) return jpeg;

    const webp = dimensaoWebp(dados);
    if (webp) return webp;

    return null;
  } catch {
    return null;
  } finally {
    await handle?.close();
  }
}

function dimensaoPng(d: Buffer): Dimensao | null {
  if (d.length < 24) return null;
  if (d.readUInt32BE(0) !== 0x89504e47) return null;
  return { largura: d.readUInt32BE(16), altura: d.readUInt32BE(20) };
}

function dimensaoJpeg(d: Buffer): Dimensao | null {
  if (d.length < 4 || d[0] !== 0xff || d[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < d.length) {
    if (d[i] !== 0xff) {
      i++;
      continue;
    }
    const marcador = d[i + 1] ?? 0;
    if (marcador === 0xd8 || marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd7)) {
      i += 2;
      continue;
    }
    const tamanho = d.readUInt16BE(i + 2);
    const ehSOF =
      marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc;
    if (ehSOF) {
      return { altura: d.readUInt16BE(i + 5), largura: d.readUInt16BE(i + 7) };
    }
    i += 2 + tamanho;
  }
  return null;
}

function dimensaoWebp(d: Buffer): Dimensao | null {
  if (d.length < 30) return null;
  if (d.toString('ascii', 0, 4) !== 'RIFF' || d.toString('ascii', 8, 12) !== 'WEBP') return null;

  const tipo = d.toString('ascii', 12, 16);

  if (tipo === 'VP8X') {
    return {
      largura: (d.readUIntLE(24, 3) & 0xffffff) + 1,
      altura: (d.readUIntLE(27, 3) & 0xffffff) + 1,
    };
  }

  if (tipo === 'VP8 ') {
    const pos = d.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));
    if (pos === -1) return null;
    return {
      largura: d.readUInt16LE(pos + 3) & 0x3fff,
      altura: d.readUInt16LE(pos + 5) & 0x3fff,
    };
  }

  if (tipo === 'VP8L') {
    const bits = d.readUInt32LE(21);
    return {
      largura: (bits & 0x3fff) + 1,
      altura: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return null;
}
