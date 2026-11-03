/**
 * Migração do acervo de arquivos para um banco SQLite.
 *
 * Não é usado pelo site hoje: a constitution mantém o acervo em arquivo até o
 * volume justificar a troca (FR-131). Quando a hora chegar, este comando lê
 * `content/` e grava no banco — sem tocar em páginas, rotas ou componentes.
 *
 * A nova implementação dos repositórios (`src/lib/content/*.repository.ts`)
 * passa a ler do banco em vez do disco; nada mais muda.
 *
 * Uso: node scripts/migrate-to-db.mjs --destino data/site.db [--verificar]
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { postRepository } from '../src/lib/content/file-post.repository.ts';
import { agendaRepository } from '../src/lib/content/file-agenda.repository.ts';
import { releaseRepository } from '../src/lib/content/file-release.repository.ts';

const RAIZ = process.cwd();

function arg(nome, padrao) {
  const i = process.argv.indexOf(`--${nome}`);
  return i !== -1 ? (process.argv[i + 1] ?? padrao) : padrao;
}

const destino = join(RAIZ, arg('destino', 'data/site.db'));
const verificar = process.argv.includes('--verificar');

async function main() {
  if (verificar) {
    const posts = await postRepository.list({ incluirPrivados: true });
    const eventos = await agendaRepository.list();
    const lancamentos = await releaseRepository.list();
    console.log(
      `Arquivos: ${posts.length} posts, ${eventos.length} eventos, ${lancamentos.length} lançamentos`,
    );
    console.log(`Para migrar: node scripts/migrate-to-db.mjs --destino ${destino}`);
    return;
  }

  await mkdir(dirname(destino), { recursive: true });
  const db = new DatabaseSync(destino);

  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      slug TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      data TEXT NOT NULL,
      categoria TEXT NOT NULL,
      pasta TEXT NOT NULL,
      descricao TEXT NOT NULL,
      tags TEXT NOT NULL,
      midias TEXT NOT NULL,
      privado INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS eventos (
      slug TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      data TEXT NOT NULL,
      local TEXT NOT NULL,
      cidade TEXT NOT NULL,
      descricao TEXT NOT NULL,
      links TEXT NOT NULL,
      divulgar_email INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS lancamentos (
      slug TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL,
      ano INTEGER NOT NULL,
      data TEXT,
      descricao TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS faixas (
      lancamento TEXT NOT NULL,
      slug TEXT NOT NULL,
      titulo TEXT NOT NULL,
      audio TEXT,
      duracao TEXT,
      letra TEXT,
      PRIMARY KEY (lancamento, slug)
    );
  `);

  const inserirPost = db.prepare(
    `INSERT OR REPLACE INTO posts (slug, nome, data, categoria, pasta, descricao, tags, midias, privado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const inserirEvento = db.prepare(
    `INSERT OR REPLACE INTO eventos (slug, titulo, data, local, cidade, descricao, links, divulgar_email)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const inserirLancamento = db.prepare(
    `INSERT OR REPLACE INTO lancamentos (slug, nome, tipo, ano, data, descricao) VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const inserirFaixa = db.prepare(
    `INSERT OR REPLACE INTO faixas (lancamento, slug, titulo, audio, duracao, letra) VALUES (?, ?, ?, ?, ?, ?)`,
  );

  db.exec('BEGIN');
  try {
    const posts = await postRepository.list({ incluirPrivados: true });
    for (const post of posts) {
      inserirPost.run(
        post.slug,
        post.nome,
        post.data,
        post.categoria,
        post.pasta,
        post.descricao,
        JSON.stringify(post.tags),
        JSON.stringify(post.midias.map((m) => m.caminho)),
        post.privado ? 1 : 0,
      );
    }

    const eventos = await agendaRepository.list();
    for (const evento of eventos) {
      inserirEvento.run(
        evento.slug,
        evento.titulo,
        evento.data,
        evento.local,
        evento.cidade,
        evento.descricao,
        JSON.stringify(evento.links),
        evento.divulgarEmail ? 1 : 0,
      );
    }

    const lancamentos = await releaseRepository.list();
    for (const lancamento of lancamentos) {
      inserirLancamento.run(
        lancamento.slug,
        lancamento.nome,
        lancamento.tipo,
        lancamento.ano,
        lancamento.data,
        lancamento.descricao,
      );
      for (const faixa of lancamento.faixas) {
        inserirFaixa.run(
          lancamento.slug,
          faixa.slug,
          faixa.titulo,
          faixa.audio?.caminho ?? null,
          faixa.duracao,
          faixa.letra,
        );
      }
    }
    db.exec('COMMIT');
  } catch (erro) {
    db.exec('ROLLBACK');
    throw erro;
  }

  const total = db.prepare('SELECT COUNT(*) AS n FROM posts').get();
  console.log(`Migrado para ${destino} (${total.n} posts).`);
  console.log('O acervo continua em arquivo: o git segue sendo o backup.');
  db.close();
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
