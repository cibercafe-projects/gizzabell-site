import { describe, expect, it } from 'vitest';
import {
  dividirDocumentos,
  markdownParaHtml,
  markdownParaTexto,
  resumo,
  separarArquivo,
  separarFrontmatter,
} from '~/lib/markdown';

const MULTI = `---
nome: Post A
categoria: show
---
Corpo do post A

---
nome: Post B
categoria: feed
---
Corpo do post B
`;

describe('markdown do acervo', () => {
  it('divide um arquivo em documentos com frontmatter e corpo', () => {
    const documentos = dividirDocumentos(MULTI);
    expect(documentos).toHaveLength(2);

    const a = separarFrontmatter(documentos[0]!.frontmatter, documentos[0]!.corpo);
    expect(a.dados.nome).toBe('Post A');
    expect(a.corpo.trim()).toBe('Corpo do post A');

    const b = separarFrontmatter(documentos[1]!.frontmatter, documentos[1]!.corpo);
    expect(b.dados.nome).toBe('Post B');
  });

  it('separa frontmatter e corpo de um arquivo de documento único', () => {
    const { frontmatter, corpo } = separarArquivo('---\ntitulo: Evento\ndata: 2026-12-05\n---\nDescrição');
    const { dados } = separarFrontmatter(frontmatter, corpo);
    expect(dados.titulo).toBe('Evento');
    expect(corpo.trim()).toBe('Descrição');
  });

  it('descarta HTML cru do conteúdo', () => {
    const html = markdownParaHtml('Antes <script>alert(1)</script> depois');
    expect(html).not.toContain('<script>');
    expect(html).toContain('Antes');
  });

  it('descarta links perigosos', () => {
    const html = markdownParaHtml('[clique](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });

  it('mantém links http', () => {
    const html = markdownParaHtml('[site](https://exemplo.com)');
    expect(html).toContain('https://exemplo.com');
  });

  it('extrai texto simples para busca', () => {
    const texto = markdownParaTexto('**Neon** e [links](https://exemplo.com)');
    expect(texto).toContain('Neon');
    expect(texto).not.toContain('https://');
  });

  it('resume textos longos', () => {
    const curto = resumo('a'.repeat(50), 10);
    expect(curto.length).toBeLessThanOrEqual(10);
    expect(curto.endsWith('…')).toBe(true);
  });
});
