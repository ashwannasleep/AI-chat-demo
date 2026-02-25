function renderInline(text, keyPrefix) {
  const nodes = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let match;
  let lastIndex = 0;
  let tokenIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    const [token] = match;
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (token.startsWith('**')) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${tokenIndex}`}>
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={`${keyPrefix}-c-${tokenIndex}`}>
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(
        <em key={`${keyPrefix}-i-${tokenIndex}`}>
          {token.slice(1, -1)}
        </em>,
      );
    }

    tokenIndex += 1;
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function isNewBlock(line) {
  const trimmed = line.trim();
  return (
    trimmed === '' ||
    /^#{1,3}\s+/.test(trimmed) ||
    /^[-*]\s+/.test(trimmed) ||
    /^\d+\.\s+/.test(trimmed) ||
    trimmed.startsWith('```')
  );
}

function parseBlocks(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];

  for (let i = 0; i < lines.length;) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (line === '') {
      i += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      i += 1;
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: 'code', lang, content: codeLines.join('\n') });
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      blocks.push({ type: 'heading', content: line.replace(/^#{1,3}\s+/, '') });
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    const paragraphLines = [rawLine.trim()];
    i += 1;
    while (i < lines.length && !isNewBlock(lines[i])) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'p', content: paragraphLines.join(' ') });
  }

  return blocks;
}

export default function RichText({ text }) {
  const blocks = parseBlocks(text ?? '');

  return (
    <div className="rich-text">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === 'heading') {
          return <h3 key={key}>{renderInline(block.content, key)}</h3>;
        }

        if (block.type === 'ul') {
          return (
            <ul key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-li-${itemIndex}`}>{renderInline(item, `${key}-li-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-li-${itemIndex}`}>{renderInline(item, `${key}-li-${itemIndex}`)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === 'code') {
          return (
            <div key={key} className="rich-text__code-block">
              {block.lang && <span className="rich-text__code-lang">{block.lang}</span>}
              <pre>
                <code>{block.content}</code>
              </pre>
            </div>
          );
        }

        return <p key={key}>{renderInline(block.content, key)}</p>;
      })}
    </div>
  );
}
