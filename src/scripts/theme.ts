const botao = document.querySelector<HTMLButtonElement>('[data-alterna-tema]');
const glifo = document.querySelector<HTMLElement>('[data-glifo-tema]');

function aplicar(tema: string): void {
  document.documentElement.dataset.tema = tema;
  try {
    localStorage.setItem('gizzabell:tema', tema);
  } catch {}
  if (glifo) glifo.textContent = tema === 'claro' ? '☀' : '◐';
}

botao?.addEventListener('click', () => {
  const atual = document.documentElement.dataset.tema === 'claro' ? 'escuro' : 'claro';
  aplicar(atual);
});

aplicar(document.documentElement.dataset.tema === 'claro' ? 'claro' : 'escuro');

export {};
