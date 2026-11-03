/**
 * Cria (ou recria) a conta única da artista.
 * Uso: npm run admin:create -- --usuario artista
 * A senha é pedida no terminal e nunca é gravada em texto puro.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const RAIZ = process.cwd();
const DIR_DATA = join(RAIZ, 'data');
const ARQUIVO = join(DIR_DATA, 'admin.json');

function arg(nome) {
  const indice = process.argv.indexOf(`--${nome}`);
  return indice !== -1 ? process.argv[indice + 1] : undefined;
}

async function perguntar(pergunta) {
  const rl = createInterface({ input: stdin, output: stdout });
  const resposta = await rl.question(pergunta);
  rl.close();
  return resposta.trim();
}

async function main() {
  let usuario = arg('usuario');
  if (!usuario) usuario = await perguntar('Usuário da artista: ');
  if (!usuario) {
    console.error('Usuário obrigatório.');
    process.exit(1);
  }

  const senha =
    arg('senha') ?? process.env.ADMIN_SENHA ?? (await perguntar('Senha (mínimo 10 caracteres): '));
  if (senha.length < 10) {
    console.error('Senha muito curta.');
    process.exit(1);
  }

  const { gerarHash } = await import('../src/lib/auth/password.ts');
  const hash = await gerarHash(senha);

  await mkdir(DIR_DATA, { recursive: true });
  await writeFile(
    ARQUIVO,
    JSON.stringify(
      { usuario, hash, bloqueadoAte: null, ultimaFalha: null },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`\nConta "${usuario}" criada em data/admin.json (fora do git).`);
  try {
    await readFile(join(RAIZ, '.gitignore'), 'utf8');
  } catch {}
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
