import type { ReactNode } from 'react';

function renderInline(value: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  return value.split(pattern).filter(Boolean).map((part, index) => {
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={index} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-wine-50 px-1.5 py-0.5 text-[0.9em] text-wine-800 dark:bg-muted dark:text-wine-300">{part.slice(1, -1)}</code>;
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) {
      return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-wine-700 underline decoration-wine-700/30 underline-offset-2 hover:decoration-wine-700">{link[1]}</a>;
    }
    return part;
  });
}

export function MarkdownContent({ content, className = '' }: { content: string; className?: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const headingClass = level === 1 ? 'text-xl' : level === 2 ? 'text-lg' : 'text-base';
      blocks.push(<h3 key={index} className={`mt-6 first:mt-0 font-black tracking-[-0.02em] text-foreground ${headingClass}`}>{renderInline(heading[2])}</h3>);
      index += 1; continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*+]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*+]\s+/, '')); index += 1;
      }
      blocks.push(<ul key={`ul-${index}`} className="my-4 space-y-2 pl-5 marker:text-[#e99a55]">{items.map((item, itemIndex) => <li key={itemIndex} className="list-disc pl-1">{renderInline(item)}</li>)}</ul>);
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/, '')); index += 1;
      }
      blocks.push(<ol key={`ol-${index}`} className="my-4 space-y-2 pl-5 marker:font-bold marker:text-wine-700">{items.map((item, itemIndex) => <li key={itemIndex} className="list-decimal pl-1">{renderInline(item)}</li>)}</ol>);
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+|^[-*+]\s+|^\d+[.)]\s+/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim()); index += 1;
    }
    blocks.push(<p key={`p-${index}`}>{renderInline(paragraph.join(' '))}</p>);
  }

  return <div className={`space-y-4 leading-[1.75] text-[#625b54] dark:text-muted-foreground ${className}`}>{blocks}</div>;
}
