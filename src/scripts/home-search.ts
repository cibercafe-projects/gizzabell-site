const campo = document.querySelector<HTMLInputElement>('[data-busca-home]');
const status = document.querySelector<HTMLElement>('[data-status]');

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function filtrar(): void {
  const termo = normalizar(campo?.value ?? '');
  let visiveis = 0;

  for (const container of document.querySelectorAll<HTMLElement>('[data-mosaico], [data-feed]')) {
    for (const item of container.querySelectorAll<HTMLElement>('[data-slug]')) {
      const texto = normalizar(item.textContent ?? '');
      const casa = termo === '' || texto.includes(termo);
      item.hidden = !casa;
      if (casa && container.dataset.visualizacao !== undefined) visiveis += 1;
    }
  }

  if (status) {
    if (termo === '') {
      status.hidden = true;
      status.textContent = '';
    } else {
      status.hidden = false;
      status.textContent =
        visiveis > 0
          ? `${visiveis} post(s) encontrado(s) para "${campo?.value ?? ''}"`
          : `Nenhum post encontrado para "${campo?.value ?? ''}"`;
    }
  }
}

campo?.addEventListener('input', filtrar);
campo?.addEventListener('search', filtrar);

export {};
