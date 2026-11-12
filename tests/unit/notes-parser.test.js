import { describe, expect, it } from 'vitest';
import { buildNotesFragment, normalizeText, parseNotesBlocks, tokenizeInline } from '../../src/domain/notes-parser.js';

describe('notes-parser domain & XSS sanitization', () => {
  it('normalizes diacritics and case consistently', () => {
    expect(normalizeText('  Padrão-Ouro: Coração  ')).toBe('padrao-ouro: coracao');
  });

  it('tokenizes bold segments and all clinical markers', () => {
    const tokens = tokenizeInline('**IECA** reduz pré-carga [Alerta: Hipercalemia] [Padrão-Ouro: Eco TT] [Conduta: Furosemida]');
    expect(tokens.some((t) => t.type === 'bold' && t.value === 'IECA')).toBe(true);
    expect(tokens.some((t) => t.type === 'tag' && t.tone === 'red' && t.value === 'Hipercalemia')).toBe(true);
    expect(tokens.some((t) => t.type === 'tag' && t.tone === 'green' && t.label === 'Padrão-Ouro')).toBe(true);
    expect(tokens.some((t) => t.type === 'tag' && t.tone === 'purple' && t.value === 'Furosemida')).toBe(true);
  });

  it('groups bullet lines into list blocks safely', () => {
    const blocks = parseNotesBlocks('Resumo inicial\n• Critério maior\n• Critério menor\n\nFim');
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'list', 'spacer', 'paragraph']);
    expect(blocks[1].items).toHaveLength(2);
  });

  it('neutralizes injected HTML/script payloads when constructing DOM fragments', () => {
    const container = document.createElement('div');
    const malicious = '<img src=x onerror=alert(1)> **Dor torácica** [Alerta: <script>steal()</script>]';
    container.appendChild(buildNotesFragment(document, malicious));

    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(container.querySelectorAll('script')).toHaveLength(0);
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(container.querySelector('.clinical-tag--red')?.textContent).toContain('Alerta: <script>steal()</script>');
  });
});
