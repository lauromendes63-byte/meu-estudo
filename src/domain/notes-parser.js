const TAG_TONES = {
  alerta: { tone: 'red', label: 'Alerta' },
  fisiopato: { tone: 'yellow', label: 'Fisiopato' },
  'padrao-ouro': { tone: 'green', label: 'Padrão-Ouro' },
  diagnostico: { tone: 'green', label: 'Diagnóstico' },
  conduta: { tone: 'purple', label: 'Conduta' },
  conceito: { tone: 'blue', label: 'Conceito' }
};

export function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const INLINE_TOKEN_RE = /(\*\*[^*]+?\*\*|\[(?:Alerta|Fisiopato|Padrão-Ouro|Padrao-Ouro|Diagnóstico|Diagnostico|Conduta|Conceito|Destaque)\s*:[^\]]*?\])/gi;

function resolveTagMeta(rawLabel) {
  const norm = normalizeText(rawLabel);
  if (TAG_TONES[norm]) return TAG_TONES[norm];
  return { tone: 'blue', label: rawLabel.trim() || 'Nota' };
}

export function tokenizeInline(lineText) {
  const tokens = [];
  let lastIndex = 0;
  INLINE_TOKEN_RE.lastIndex = 0;

  let match;
  while ((match = INLINE_TOKEN_RE.exec(lineText)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: lineText.slice(lastIndex, match.index) });
    }

    const segment = match[0];
    if (segment.startsWith('**') && segment.endsWith('**')) {
      tokens.push({ type: 'bold', value: segment.slice(2, -2) });
    } else if (segment.startsWith('[') && segment.endsWith(']')) {
      const inner = segment.slice(1, -1);
      const colonIdx = inner.indexOf(':');
      const rawLabel = colonIdx >= 0 ? inner.slice(0, colonIdx) : inner;
      const body = colonIdx >= 0 ? inner.slice(colonIdx + 1).trim() : '';
      const meta = resolveTagMeta(rawLabel);
      tokens.push({
        type: 'tag',
        tone: meta.tone,
        label: meta.label,
        value: body
      });
    }

    lastIndex = match.index + segment.length;
  }

  if (lastIndex < lineText.length) {
    tokens.push({ type: 'text', value: lineText.slice(lastIndex) });
  }

  return tokens;
}

export function parseNotesBlocks(text) {
  if (!text || !String(text).trim()) return [];

  const rawLines = String(text).split(/\r?\n/);
  const blocks = [];
  let pendingBullets = null;

  const flushBullets = () => {
    if (pendingBullets && pendingBullets.items.length > 0) {
      blocks.push(pendingBullets);
    }
    pendingBullets = null;
  };

  for (const line of rawLines) {
    const bulletMatch = line.match(/^\s*•\s*(.*)$/);
    if (bulletMatch) {
      if (!pendingBullets) {
        pendingBullets = { type: 'list', items: [] };
      }
      pendingBullets.items.push(tokenizeInline(bulletMatch[1]));
    } else {
      flushBullets();
      if (line.trim() === '') {
        blocks.push({ type: 'spacer' });
      } else {
        blocks.push({ type: 'paragraph', tokens: tokenizeInline(line) });
      }
    }
  }

  flushBullets();
  return blocks;
}

function appendInlineTokens(doc, parent, tokens) {
  for (const token of tokens) {
    if (token.type === 'text') {
      parent.appendChild(doc.createTextNode(token.value));
    } else if (token.type === 'bold') {
      const strong = doc.createElement('strong');
      strong.className = 'notes-bold';
      strong.textContent = token.value;
      parent.appendChild(strong);
    } else if (token.type === 'tag') {
      const span = doc.createElement('span');
      span.className = `clinical-tag clinical-tag--${token.tone}`;

      const dot = doc.createElement('span');
      dot.className = 'clinical-tag__dot';
      dot.setAttribute('aria-hidden', 'true');
      span.appendChild(dot);

      const labelText = token.value ? `${token.label}: ${token.value}` : token.label;
      span.appendChild(doc.createTextNode(labelText));
      parent.appendChild(span);
    }
  }
}

export function buildNotesFragment(doc, text) {
  const fragment = doc.createDocumentFragment();
  const blocks = parseNotesBlocks(text);

  if (blocks.length === 0) {
    const empty = doc.createElement('p');
    empty.className = 'notes-empty';
    empty.textContent = 'Nenhuma anotação registrada.';
    fragment.appendChild(empty);
    return fragment;
  }

  for (const block of blocks) {
    if (block.type === 'list') {
      const ul = doc.createElement('ul');
      ul.className = 'notes-list';
      for (const itemTokens of block.items) {
        const li = doc.createElement('li');
        appendInlineTokens(doc, li, itemTokens);
        ul.appendChild(li);
      }
      fragment.appendChild(ul);
    } else if (block.type === 'spacer') {
      const br = doc.createElement('div');
      br.className = 'notes-spacer';
      br.setAttribute('aria-hidden', 'true');
      fragment.appendChild(br);
    } else {
      const p = doc.createElement('p');
      p.className = 'notes-paragraph';
      appendInlineTokens(doc, p, block.tokens);
      fragment.appendChild(p);
    }
  }

  return fragment;
}
