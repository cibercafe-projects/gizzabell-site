/**
 * Cria um acervo de exemplo para desenvolvimento.
 * Uso: npm run seed:fixtures
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const RAIZ = process.cwd();
const CONTENT = join(RAIZ, 'content');
const FILES = join(RAIZ, 'files');

const PALETA = [
  ['#ff2e88', '#2b0a3d'],
  ['#00eaff', '#041a2b'],
  ['#b4ff00', '#0d2000'],
  ['#a45cff', '#1a0733'],
  ['#ffb300', '#2b1a00'],
  ['#ff4d6d', '#2b0413'],
];

function svgLargadao(alto, largura, cores, indice) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${alto}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${cores[0]}" />
      <stop offset="100%" stop-color="${cores[1]}" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)" />
  <g fill="none" stroke="${cores[0]}" stroke-opacity="0.55" stroke-width="2">
    ${Array.from({ length: 9 }, (_, i) => `<circle cx="${largura * 0.5}" cy="${alto * 0.5}" r="${40 + i * 46}" />`).join('\n    ')}
  </g>
  <text x="50%" y="50%" fill="#ffffff" fill-opacity="0.92" font-family="monospace" font-size="${Math.round(largura / 14)}" text-anchor="middle" dominant-baseline="middle">${String(indice + 1).padStart(2, '0')}</text>
</svg>`;
}

async function gerarImagem(dir, nome, largura, alto, indice) {
  const cores = PALETA[indice % PALETA.length];
  await mkdir(dir, { recursive: true });
  await sharp(Buffer.from(svgLargadao(alto, largura, cores, indice)))
    .webp({ quality: 82 })
    .toFile(join(dir, nome));
}

/** WAV PCM 16 bits mono — um tom simples para testar o player. */
function gerarWav(caminho, segundos = 3, frequencia = 220) {
  const taxa = 8000;
  const amostras = Math.floor(taxa * segundos);
  const buffer = Buffer.alloc(44 + amostras * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + amostras * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(taxa, 24);
  buffer.writeUInt32LE(taxa * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(amostras * 2, 40);
  for (let i = 0; i < amostras; i++) {
    const valor = Math.round(Math.sin((2 * Math.PI * frequencia * i) / taxa) * 6000);
    buffer.writeInt16LE(valor, 44 + i * 2);
  }
  return buffer;
}

const POSTS = [
  {
    pasta: '14-11-2026-18-30-45-show-casa-blue',
    nome: 'Show na Casa Blue',
    data: '2026-11-14',
    categoria: 'show',
    midias: 3,
    descricao:
      'Primeira apresentação do set novo. **Casa Blue**, São Paulo.\n\nSet completo com banda ao vivo.',
  },
  {
    pasta: '14-11-2026-19-05-10-sessao-estudio',
    nome: 'Sessão de estúdio',
    data: '2026-11-14',
    categoria: 'trabalhos',
    midias: 2,
    descricao: 'Gravando as faixas do próximo EP. Ainda cru, mas já com a cara certa.',
  },
  {
    pasta: '16-11-2026-09-12-44-capa-neon',
    nome: 'Capa do EP Neon',
    data: '2026-11-16',
    categoria: 'lancamento',
    midias: 1,
    descricao: 'Arte final da capa do **EP Neon**. Sai na próxima semana.',
  },
  {
    pasta: '18-11-2026-21-40-02-ensaio',
    nome: 'Ensaio em casa',
    data: '2026-11-18',
    categoria: 'feed',
    midias: 2,
    descricao: 'Ensaio de sábado. Só pra constar no feed.',
  },
  {
    pasta: '20-11-2026-16-05-55-lote-imagens',
    nome: 'Lote de imagens antigas',
    data: '2026-11-20',
    categoria: 'feed',
    midias: 4,
    descricao: 'Material digitalizado que estava perdido. Vale a pena ver.',
  },
];

async function main() {
  console.log('Criando acervo de exemplo…');

  await mkdir(CONTENT, { recursive: true });
  await mkdir(join(CONTENT, '2026'), { recursive: true });
  await mkdir(join(CONTENT, 'agenda'), { recursive: true });
  await mkdir(join(CONTENT, 'discografia'), { recursive: true });
  await mkdir(join(CONTENT, 'colecoes'), { recursive: true });
  await mkdir(join(FILES, 'pics'), { recursive: true });
  await mkdir(join(FILES, 'audio'), { recursive: true });

  const blocos = [];
  for (const [indice, post] of POSTS.entries()) {
    const pasta = join(FILES, 'pics', post.pasta);
    await mkdir(pasta, { recursive: true });
    for (let m = 0; m < post.midias; m++) {
      await gerarImagem(
        pasta,
        `${String(m + 1).padStart(2, '0')}.webp`,
        1200,
        1200,
        indice * 3 + m,
      );
    }

    const midias = Array.from(
      { length: post.midias },
      (_, m) => `  - pics/${post.pasta}/${String(m + 1).padStart(2, '0')}.webp`,
    ).join('\n');

    blocos.push(
      [
        '---',
        'formato: 1',
        `nome: ${JSON.stringify(post.nome)}`,
        `data: ${post.data}`,
        `categoria: ${post.categoria}`,
        `pasta: ${post.pasta}`,
        'midias:',
        midias,
        '---',
        '',
        post.descricao,
        '',
      ].join('\n'),
    );
  }
  await writeFile(join(CONTENT, '2026', '11.md'), `${blocos.join('\n')}\n`, 'utf8');

  await writeFile(
    join(CONTENT, 'index.md'),
    ['---', 'formato: 1', 'pastas:', ...POSTS.map((p) => `  - ${p.pasta}`), '---', ''].join('\n'),
    'utf8',
  );

  const capaLancamento = join(FILES, 'pics', 'discografia');
  await mkdir(capaLancamento, { recursive: true });
  await sharp(Buffer.from(svgLargadao(1200, 1200, ['#00eaff', '#1b0030'], 8)))
    .webp({ quality: 82 })
    .toFile(join(capaLancamento, 'neon.webp'));

  const audio = join(FILES, 'audio', 'neon');
  await mkdir(audio, { recursive: true });
  await writeFile(join(audio, 'lost.wav'), gerarWav(join(audio, 'lost.wav'), 3, 220));
  await writeFile(join(audio, 'halo.wav'), gerarWav(join(audio, 'halo.wav'), 3, 294));

  await writeFile(
    join(CONTENT, 'discografia', 'ep-neon.md'),
    [
      '---',
      'formato: 1',
      'nome: "EP Neon"',
      'tipo: ep',
      'ano: 2026',
      'data: 2026-11-20',
      'capa: pics/discografia/neon.webp',
      'faixas:',
      '  - titulo: "Lost"',
      '    audio: audio/neon/lost.wav',
      '    duracao: "3:00"',
      '  - titulo: "Halo"',
      '    audio: audio/neon/halo.wav',
      '    duracao: "3:00"',
      '---',
      '',
      'Duas faixas gravadas em uma madrugada de November.',
      '',
      '## Letra — Lost',
      '',
      'Caminho sem **sinal**,',
      'e a cidade inteira em **neon**.',
      '',
      '## Letra — Halo',
      '',
      'Tudo que era cinza vira *halo*.',
      '',
    ].join('\n'),
    'utf8',
  );

  const cartaz = join(FILES, 'pics', 'agenda');
  await mkdir(cartaz, { recursive: true });
  await sharp(Buffer.from(svgLargadao(1500, 1000, ['#ffb300', '#1a0033'], 9)))
    .webp({ quality: 82 })
    .toFile(join(cartaz, 'show-2026-12-05.webp'));

  await writeFile(
    join(CONTENT, 'agenda', 'show-casa-blue-2026-12-05.md'),
    [
      '---',
      'formato: 1',
      'titulo: "Show na Casa Blue"',
      'data: 2026-12-05',
      'local: "Casa Blue"',
      'cidade: "São Paulo"',
      'cartaz: pics/agenda/show-2026-12-05.webp',
      'divulgar_email: false',
      'links:',
      '  - rotulo: "Ingressos"',
      '    url: "https://exemplo.com/ingressos"',
      '---',
      '',
      'Show de abertura do EP Neon, com a banda completa.',
      '',
    ].join('\n'),
    'utf8',
  );

  await writeFile(
    join(CONTENT, 'colecoes', 'favoritos.md'),
    [
      '---',
      'formato: 1',
      'nome: "Favoritos"',
      'faixas:',
      '  - ep-neon/lost',
      '  - ep-neon/halo',
      '---',
      '',
    ].join('\n'),
    'utf8',
  );

  console.log('Acervo criado em content/ e files/.');
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
