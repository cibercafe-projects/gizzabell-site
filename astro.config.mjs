// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

const site = process.env.SITE_URL ?? 'http://localhost:4321';

export default defineConfig({
  site,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // O default do Astro 7 ('jsx') remove o espaço entre elementos inline e quebra
  // texto corrido em português. 'true' mantém a compressão ciente de HTML.
  compressHTML: true,
  server: { port: Number(process.env.PORT ?? 4321), host: true },
  vite: {
    resolve: {
      alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
      extensions: ['.mjs', '.js', '.ts', '.tsx', '.astro', '.json'],
    },
    build: { assetsInlineLimit: 2048 },
  },
});
