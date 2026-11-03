interface FaixaPlayer {
  titulo: string;
  lancamento: string;
  url: string | null;
  capa: string | null;
}

interface DadosPlayer {
  faixas: FaixaPlayer[];
  lancamentos: Array<{
    slug: string;
    nome: string;
    tipo: string;
    faixas: Array<{ titulo: string; url: string | null }>;
  }>;
  colecoes: Array<{ slug: string; nome: string }>;
}

const raiz = document.querySelector<HTMLElement>('[data-player]');
const audio = document.querySelector<HTMLAudioElement>('[data-player-audio]');
const dadosEl = document.querySelector<HTMLScriptElement>('[data-player-dados]');
const botaoPlay = document.querySelector<HTMLButtonElement>('[data-player-play]');
const botaoAnterior = document.querySelector<HTMLButtonElement>('[data-player-anterior]');
const botaoProxima = document.querySelector<HTMLButtonElement>('[data-player-proxima]');
const botaoToggle = document.querySelector<HTMLButtonElement>('[data-player-toggle]');
const painel = document.querySelector<HTMLElement>('[data-player-painel]');
const seletorFonte = document.querySelector<HTMLSelectElement>('[data-player-fonte]');
const lista = document.querySelector<HTMLElement>('[data-player-lista]');
const tituloEl = document.querySelector<HTMLElement>('[data-player-titulo]');
const origemEl = document.querySelector<HTMLElement>('[data-player-origem]');
const volumeEl = document.querySelector<HTMLInputElement>('[data-player-volume]');

const CHAVE = 'gizzabell:player';

interface Estado {
  fonte: string;
  indice: number;
  tempo: number;
  tocando: boolean;
  volume: number;
  aberto: boolean;
}

let dados: DadosPlayer = { faixas: [], lancamentos: [], colecoes: [] };
let playlist: FaixaPlayer[] = [];
let indice = 0;
let fonteAtual = 'lancamentos';

function lerEstado(): Estado | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as Estado) : null;
  } catch {
    return null;
  }
}

function salvarEstado(): void {
  try {
    sessionStorage.setItem(
      CHAVE,
      JSON.stringify({
        fonte: fonteAtual,
        indice,
        tempo: audio?.currentTime ?? 0,
        tocando: Boolean(audio && !audio.paused),
        volume: audio?.volume ?? 0.8,
        aberto: raiz?.dataset.aberto === 'true',
      } satisfies Estado),
    );
  } catch {}
}

function montarPlaylist(fonte: string): FaixaPlayer[] {
  if (fonte === 'lancamentos') return dados.faixas;

  if (fonte === 'aleatoria') {
    const copia = [...dados.faixas];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j] as FaixaPlayer, copia[i] as FaixaPlayer];
    }
    return copia;
  }

  if (fonte === 'ep' || fonte === 'album') {
    const tipo = fonte === 'ep' ? 'ep' : 'album';
    const faixas: FaixaPlayer[] = [];
    for (const lancamento of dados.lancamentos.filter((l) => l.tipo === tipo)) {
      for (const faixa of lancamento.faixas) {
        faixas.push({
          titulo: faixa.titulo,
          lancamento: lancamento.nome,
          url: faixa.url,
          capa: null,
        });
      }
    }
    return faixas;
  }

  if (fonte.startsWith('colecao:')) {
    const slug = fonte.slice('colecao:'.length);
    const colecao = dados.colecoes.find((c) => c.slug === slug);
    if (!colecao) return dados.faixas;
    const faixas: FaixaPlayer[] = [];
    for (const lancamento of dados.lancamentos) {
      for (const faixa of lancamento.faixas) {
        if (colecao.slug === lancamento.slug) {
          faixas.push({
            titulo: faixa.titulo,
            lancamento: lancamento.nome,
            url: faixa.url,
            capa: null,
          });
        }
      }
    }
    return faixas;
  }

  return dados.faixas;
}

function renderizarLista(): void {
  if (!lista) return;
  lista.innerHTML = '';
  playlist.forEach((faixa, i) => {
    const item = document.createElement('li');
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = `${faixa.titulo} — ${faixa.lancamento}`;
    if (i === indice) botao.setAttribute('aria-current', 'true');
    botao.addEventListener('click', () => {
      indice = i;
      tocar(i, true);
    });
    item.appendChild(botao);
    lista.appendChild(item);
  });
}

function aplicarFonte(fonte: string, manterIndice = false): void {
  fonteAtual = fonte;
  playlist = montarPlaylist(fonte);
  if (!manterIndice) indice = 0;
  if (indice >= playlist.length) indice = 0;
  renderizarLista();
  const nome =
    seletorFonte?.selectedOptions[0]?.textContent ??
    (fonte === 'lancamentos' ? 'Lançamentos' : 'Faixas');
  if (origemEl) origemEl.textContent = nome;
}

function tocar(i: number, autoplay: boolean): void {
  const faixa = playlist[i];
  if (!faixa || !audio) return;
  indice = i;

  if (!faixa.url) {
    if (tituloEl) tituloEl.textContent = `${faixa.titulo} (sem áudio)`;
    renderizarLista();
    return;
  }

  audio.src = faixa.url;
  if (tituloEl) tituloEl.textContent = faixa.titulo;
  if (botaoPlay) botaoPlay.textContent = '⏸';
  renderizarLista();
  if (autoplay) void audio.play().catch(() => {});
  salvarEstado();
}

function alternarPlay(): void {
  if (!audio) return;
  if (audio.paused) {
    if (!audio.src && playlist.length) {
      tocar(indice, true);
      return;
    }
    void audio.play().catch(() => {});
  } else {
    audio.pause();
  }
}

function proxima(): void {
  if (!playlist.length) return;
  tocar((indice + 1) % playlist.length, true);
}

function anterior(): void {
  if (!playlist.length) return;
  tocar((indice - 1 + playlist.length) % playlist.length, true);
}

function definirAberto(aberto: boolean): void {
  if (!raiz) return;
  raiz.dataset.aberto = aberto ? 'true' : 'false';
  if (painel) painel.hidden = !aberto;
  botaoToggle?.setAttribute('aria-expanded', aberto ? 'true' : 'false');
  salvarEstado();
}

function iniciar(): void {
  if (!raiz || !audio) return;
  try {
    dados = JSON.parse(dadosEl?.textContent ?? '{}') as DadosPlayer;
  } catch {
    dados = { faixas: [], lancamentos: [], colecoes: [] };
  }

  const estado = lerEstado();
  if (estado) {
    fonteAtual = estado.fonte;
    if (seletorFonte) seletorFonte.value = estado.fonte;
    if (typeof estado.volume === 'number') {
      audio.volume = Math.min(1, Math.max(0, estado.volume));
      if (volumeEl) volumeEl.value = String(Math.round(estado.volume * 100));
    }
    definirAberto(Boolean(estado.aberto));
  } else if (volumeEl) {
    audio.volume = Number(volumeEl.value) / 100;
  }

  aplicarFonte(fonteAtual, Boolean(estado));

  if (estado) {
    indice = Math.min(estado.indice, Math.max(0, playlist.length - 1));
    const faixa = playlist[indice];
    if (faixa?.url) {
      audio.src = faixa.url;
      if (tituloEl) tituloEl.textContent = faixa.titulo;
      renderizarLista();
      if (estado.tempo > 0) {
        audio.addEventListener(
          'loadedmetadata',
          () => {
            audio.currentTime = Math.min(estado.tempo, audio.duration || estado.tempo);
          },
          { once: true },
        );
      }
      if (estado.tocando) {
        void audio.play().catch(() => {});
        if (botaoPlay) botaoPlay.textContent = '⏸';
      }
    }
  }

  botaoPlay?.addEventListener('click', alternarPlay);
  botaoProxima?.addEventListener('click', proxima);
  botaoAnterior?.addEventListener('click', anterior);
  botaoToggle?.addEventListener('click', () => {
    definirAberto(raiz.dataset.aberto !== 'true');
  });

  seletorFonte?.addEventListener('change', () => {
    aplicarFonte(seletorFonte.value);
    salvarEstado();
  });

  volumeEl?.addEventListener('input', () => {
    audio.volume = Number(volumeEl.value) / 100;
    salvarEstado();
  });

  audio.addEventListener('ended', proxima);
  audio.addEventListener('play', () => {
    if (botaoPlay) botaoPlay.textContent = '⏸';
    salvarEstado();
  });
  audio.addEventListener('pause', () => {
    if (botaoPlay) botaoPlay.textContent = '▶';
    salvarEstado();
  });
  audio.addEventListener('error', () => {
    if (tituloEl) tituloEl.textContent = 'Não foi possível tocar esta faixa';
    if (botaoPlay) botaoPlay.textContent = '▶';
  });

  window.addEventListener('pagehide', salvarEstado);
}

iniciar();

export {};
