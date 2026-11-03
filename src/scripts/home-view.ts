const CHAVE_MODO = 'gizzabell:modo';
const CHAVE_ORDEM = 'gizzabell:ordem';

type Modo = 'mosaico' | 'feed';

function ler<T extends string>(chave: string, padrao: T): T {
  try {
    return (localStorage.getItem(chave) as T) ?? padrao;
  } catch {
    return padrao;
  }
}

function salvar(chave: string, valor: string): void {
  try {
    localStorage.setItem(chave, valor);
  } catch {}
}

function aplicarModo(modo: Modo): void {
  for (const bloco of document.querySelectorAll<HTMLElement>('[data-visualizacao]')) {
    bloco.hidden = bloco.dataset.visualizacao !== modo;
  }
  for (const botao of document.querySelectorAll<HTMLButtonElement>('[data-modo]')) {
    botao.setAttribute('aria-pressed', botao.dataset.modo === modo ? 'true' : 'false');
  }
  salvar(CHAVE_MODO, modo);
}

function aplicarOrdem(ordem: string): void {
  for (const botao of document.querySelectorAll<HTMLButtonElement>('[data-ordem]')) {
    botao.setAttribute('aria-pressed', botao.dataset.ordem === ordem ? 'true' : 'false');
  }
}

async function trocarOrdem(ordem: string): Promise<void> {
  aplicarOrdem(ordem);
  salvar(CHAVE_ORDEM, ordem);

  const resposta = await fetch(`/api/ordem?ordem=${encodeURIComponent(ordem)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!resposta.ok) return;

  const dados = (await resposta.json()) as { slugs: string[] };
  if (!Array.isArray(dados.slugs)) return;

  for (const container of document.querySelectorAll<HTMLElement>('[data-mosaico], [data-feed]')) {
    const filhos = [...container.children];
    const porSlug = new Map<string, Element>();
    for (const filho of filhos) {
      const slug =
        filho instanceof HTMLElement
          ? (filho.dataset.slug ?? filho.querySelector<HTMLElement>('[data-slug]')?.dataset.slug ?? '')
          : '';
      if (slug) porSlug.set(slug, filho);
    }
    for (const slug of dados.slugs) {
      const elemento = porSlug.get(slug);
      if (elemento) container.appendChild(elemento);
    }
  }
}

for (const botao of document.querySelectorAll<HTMLButtonElement>('[data-modo]')) {
  botao.addEventListener('click', () => aplicarModo((botao.dataset.modo ?? 'mosaico') as Modo));
}

for (const botao of document.querySelectorAll<HTMLButtonElement>('[data-ordem]')) {
  botao.addEventListener('click', () => void trocarOrdem(botao.dataset.ordem ?? 'data'));
}

const modoSalvo = ler<string>(CHAVE_MODO, 'mosaico');
aplicarModo(modoSalvo === 'feed' ? 'feed' : 'mosaico');
aplicarOrdem(ler(CHAVE_ORDEM, 'data'));

export {};
