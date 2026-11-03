import type {
  ColecaoPlayer,
  EventoAgenda,
  Lancamento,
  Post,
  RankingPost,
} from '~/lib/content/types';

export interface OpcoesPost {
  incluirPrivados?: boolean;
}

export interface PostRepository {
  list(opts?: OpcoesPost): Promise<Post[]>;
  getBySlug(slug: string, opts?: OpcoesPost): Promise<Post | null>;
  /** ordem do índice `content/index.md`; pastas não listadas vão ao final, em ordem alfabética */
  orderByPasta(posts: Post[]): Promise<Post[]>;
}

export interface AgendaRepository {
  list(): Promise<EventoAgenda[]>;
  getBySlug(slug: string): Promise<EventoAgenda | null>;
  upsert(evento: EventoAgenda): Promise<EventoAgenda>;
  remove(slug: string): Promise<void>;
}

export interface ReleaseRepository {
  list(): Promise<Lancamento[]>;
  getBySlug(slug: string): Promise<Lancamento | null>;
  upsert(lancamento: Lancamento): Promise<Lancamento>;
  remove(slug: string): Promise<void>;
  /** do mais recente ao mais antigo */
  listPorRecencia(): Promise<Lancamento[]>;
}

export interface CollectionRepository {
  list(): Promise<ColecaoPlayer[]>;
}

export interface CounterStore {
  get(slug: string): Promise<number>;
  increment(slug: string): Promise<number>;
  ranking(): Promise<RankingPost[]>;
}

export interface SessionStore {
  create(usuario: string): Promise<{ id: string; expiraEm: Date }>;
  get(id: string): Promise<{ id: string; usuario: string; expiraEm: Date } | null>;
  destroy(id: string): Promise<void>;
}

export interface AuditStore {
  append(registro: {
    usuario: string;
    acao: string;
    alvo: string;
    detalhe?: Record<string, unknown>;
  }): Promise<void>;
}
