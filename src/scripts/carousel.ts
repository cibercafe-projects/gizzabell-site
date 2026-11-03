for (const carrossel of document.querySelectorAll<HTMLElement>('[data-carrossel]')) {
  const trilho = carrossel.querySelector<HTMLElement>('[data-carrossel-trilho]');
  if (!trilho) continue;
  const trilhoEl: HTMLElement = trilho;
  const indicador = carrossel.querySelector<HTMLElement>('[data-carrossel-indicador]');
  const anterior = carrossel.querySelector<HTMLButtonElement>('[data-carrossel-anterior]');
  const proximo = carrossel.querySelector<HTMLButtonElement>('[data-carrossel-proximo]');

  const itens = [...trilho.querySelectorAll<HTMLElement>('img')];
  const total = itens.length;

  function indiceAtual(): number {
    return Math.round(trilhoEl.scrollLeft / Math.max(1, trilhoEl.clientWidth));
  }

  function atualizar(): void {
    if (!indicador) return;
    const atual = Math.min(total - 1, Math.max(0, indiceAtual()));
    indicador.textContent = total > 1 ? `${atual + 1} de ${total}` : '1 mídia';
    anterior?.toggleAttribute('hidden', atual === 0);
    proximo?.toggleAttribute('hidden', atual >= total - 1);
  }

  function irPara(indice: number): void {
    const alvo = Math.min(total - 1, Math.max(0, indice));
    trilhoEl.scrollTo({ left: alvo * trilhoEl.clientWidth, behavior: 'smooth' });
  }

  anterior?.addEventListener('click', () => irPara(indiceAtual() - 1));
  proximo?.addEventListener('click', () => irPara(indiceAtual() + 1));
  trilhoEl.addEventListener('scroll', atualizar, { passive: true });

  carrossel.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowLeft') {
      evento.preventDefault();
      irPara(indiceAtual() - 1);
    }
    if (evento.key === 'ArrowRight') {
      evento.preventDefault();
      irPara(indiceAtual() + 1);
    }
  });

  trilhoEl.setAttribute('tabindex', '0');
  atualizar();
}

export {};
