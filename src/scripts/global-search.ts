interface ResultadoBusca {
  tipo: string;
  titulo: string;
  resumo: string;
  url: string;
}

const dialogo = document.querySelector<HTMLDialogElement>('[data-busca-global]');
const campo = document.querySelector<HTMLInputElement>('[data-busca-global-campo]');
const status = document.querySelector<HTMLElement>('[data-busca-global-status]');
const resultados = document.querySelector<HTMLElement>('[data-busca-global-resultados]');
const abrir = document.querySelector<HTMLButtonElement>('[data-abre-busca]');
const fechar = document.querySelector<HTMLButtonElement>('[data-busca-global-fechar]');

let timer: number | undefined;

function render(resultadosBusca: ResultadoBusca[]): void {
  if (!resultados) return;
  resultados.innerHTML = '';
  for (const item of resultadosBusca) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.url;
    const tipo = document.createElement('span');
    tipo.className = 'busca__tipo mono';
    tipo.textContent = item.tipo;
    const titulo = document.createElement('span');
    titulo.textContent = item.titulo;
    const resumo = document.createElement('p');
    resumo.className = 'mono';
    resumo.textContent = item.resumo;
    a.append(tipo, titulo, resumo);
    li.appendChild(a);
    resultados.appendChild(li);
  }
}

async function buscar(termo: string): Promise<void> {
  if (!status || !resultados) return;
  if (termo.trim().length < 2) {
    resultados.innerHTML = '';
    status.textContent = '';
    return;
  }

  try {
    const resposta = await fetch(`/api/search?q=${encodeURIComponent(termo)}&limite=10`);
    if (!resposta.ok) {
      status.textContent = 'Busca indisponível.';
      return;
    }
    const dados = (await resposta.json()) as { total: number; resultados: ResultadoBusca[] };
    render(dados.resultados ?? []);
    status.textContent =
      dados.total > 0
        ? `${dados.total} resultado(s) para "${termo}"`
        : `Nada encontrado para "${termo}"`;
  } catch {
    status.textContent = 'Busca indisponível.';
  }
}

abrir?.addEventListener('click', () => {
  dialogo?.showModal();
  campo?.focus();
});

fechar?.addEventListener('click', () => dialogo?.close());

dialogo?.addEventListener('close', () => {
  if (campo) campo.value = '';
  if (resultados) resultados.innerHTML = '';
  if (status) status.textContent = '';
});

campo?.addEventListener('input', () => {
  if (timer) window.clearTimeout(timer);
  const termo = campo.value;
  timer = window.setTimeout(() => void buscar(termo), 300);
});

campo?.addEventListener('keydown', (evento) => {
  if (evento.key === 'Enter') {
    evento.preventDefault();
    if (timer) window.clearTimeout(timer);
    void buscar(campo.value);
  }
});

export {};
