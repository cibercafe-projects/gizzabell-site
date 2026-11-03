import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export interface ResultadoCommit {
  ok: boolean;
  hash: string | null;
  erro?: string;
}

async function git(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await exec('git', args, {
    cwd,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: process.env.GIT_AUTHOR_NAME ?? 'Gizza Bell',
      GIT_AUTHOR_EMAIL: process.env.GIT_AUTHOR_EMAIL ?? 'artista@gizzabell.local',
      GIT_COMMITTER_NAME: process.env.GIT_COMMITTER_NAME ?? 'Gizza Bell',
      GIT_COMMITTER_EMAIL: process.env.GIT_COMMITTER_EMAIL ?? 'artista@gizzabell.local',
    },
  });
  return { stdout: String(stdout), stderr: String(stderr) };
}

/** Versiona as alterações do acervo em um commit. O push é best-effort. */
export async function commitar(
  raiz: string,
  mensagem: string,
  arquivos: string[],
): Promise<ResultadoCommit> {
  try {
    await git(['add', '--', ...arquivos], raiz);
    const { stdout } = await git(['commit', '-m', mensagem], raiz);
    const hash = /\[.+ ([0-9a-f]{7,40})\]/.exec(stdout)?.[1] ?? null;

    try {
      await git(['push'], raiz);
    } catch {
      // push é opcional: o commit local já é o versionamento do acervo
    }

    return { ok: true, hash };
  } catch (erro) {
    const e = erro as { stderr?: string; stdout?: string };
    const texto = (e.stderr ?? e.stdout ?? (erro as Error).message ?? '').trim();
    // nada para commitar não é erro
    if (/nothing to commit|no changes added/i.test(texto)) {
      return { ok: true, hash: null };
    }
    return { ok: false, hash: null, erro: texto };
  }
}
