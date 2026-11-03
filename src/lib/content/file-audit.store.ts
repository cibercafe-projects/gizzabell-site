import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { DIR_DATA } from '~/lib/content/cache';
import type { AuditStore } from '~/lib/content/repository';

const ARQUIVO = join(DIR_DATA, 'audit.jsonl');

export const auditStore: AuditStore = {
  async append(registro): Promise<void> {
    try {
      await mkdir(DIR_DATA, { recursive: true });
      const linha = JSON.stringify({
        em: new Date().toISOString(),
        usuario: registro.usuario,
        acao: registro.acao,
        alvo: registro.alvo,
        detalhe: registro.detalhe ?? null,
      });
      await appendFile(ARQUIVO, `${linha}\n`, 'utf8');
    } catch {
      // auditoria nunca derruba a operação
    }
  },
};
