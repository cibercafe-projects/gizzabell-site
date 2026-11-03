/**
 * Prepara a mídia: converte imagens para WebP e gera posters de vídeo.
 * Só roda em desenvolvimento — o servidor nunca carrega o sharp.
 *
 * Uso: node scripts/prepare-assets.mjs [--forca]
 */
import { readdir, stat, unlink } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

const RAIZ = process.cwd();
const FILES = join(RAIZ, 'files');
const forca = process.argv.includes('--forca');

const EXTENSOES = ['.jpg', '.jpeg', '.png'];

async function andar(dir) {
  const entradas = await readdir(dir, { withFileTypes: true });
  for (const entrada of entradas) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      await andar(caminho);
      continue;
    }
    if (!EXTENSOES.includes(extname(entrada.name).toLowerCase())) continue;

    const destino = join(dir, `${basename(entrada.name, extname(entrada.name))}.webp`);
    if (!forca) {
      try {
        await stat(destino);
        continue;
      } catch {}
    }

    const buffer = await sharp(caminho).webp({ quality: 82 }).toBuffer();
    await sharp(buffer).toFile(destino);
    await unlink(caminho);
    console.log(`webp: ${caminho.replace(RAIZ, '.')} -> ${destino.replace(RAIZ, '.')}`);
  }
}

async function main() {
  await andar(FILES);
  console.log('Mídia preparada.');
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
