/**
 * The inline Markdown subset posts may use: `code`, **bold**, *emphasis* and
 * [links](https://example.com). Anything else is plain text.
 */
export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; text: string }
  | { kind: 'em'; text: string }
  | { kind: 'link'; text: string; href: string };

const TOKEN = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;

  for (const match of source.matchAll(TOKEN)) {
    const at = match.index ?? 0;
    if (at > last) out.push({ kind: 'text', text: source.slice(last, at) });

    if (match[1] !== undefined) out.push({ kind: 'code', text: match[1] });
    else if (match[2] !== undefined) out.push({ kind: 'strong', text: match[2] });
    else if (match[3] !== undefined) out.push({ kind: 'em', text: match[3] });
    else out.push({ kind: 'link', text: match[4], href: match[5] });

    last = at + match[0].length;
  }

  if (last < source.length) out.push({ kind: 'text', text: source.slice(last) });
  return out;
}

/** Root-relative links stay inside the app; everything else opens the real URL. */
export function isInternal(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}
