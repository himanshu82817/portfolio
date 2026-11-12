/**
 * The shape of a blog post.
 *
 * Posts are typed data, like case studies, rather than Markdown rendered at
 * runtime: no parser dependency, nothing injected as HTML, and a malformed post
 * fails to compile. Inline text supports a small Markdown subset — see inline.ts.
 */
export type Block =
  | { kind: 'heading'; level: 2 | 3; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'code'; language: string; code: string }
  | { kind: 'table'; head: string[]; rows: string[][] };

/** What the list page and the router need. Kept apart from the body so the
 *  navbar can ask "is there anything to read?" without downloading any post. */
export interface PostMeta {
  /** URL segment: /writing/<slug>. */
  slug: string;
  title: string;
  description: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  tags: string[];
  readingMinutes: number;
  /**
   * Unpublished posts are only listed and routed in development builds, where
   * they render with a draft banner. Production builds never show them.
   */
  published: boolean;
  /** Loads the body on demand, so each post is its own lazy chunk. */
  load: () => Promise<Block[]>;
}
