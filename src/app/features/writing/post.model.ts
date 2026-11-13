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

/**
 * What the list page and the router need: `posts/<slug>.meta.ts`. Kept apart from the
 * body so the navbar can ask "is there anything to read?" without downloading a post.
 */
export interface PostInfo {
  /** URL segment: /writing/<slug>. */
  slug: string;
  title: string;
  description: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  tags: string[];
  readingMinutes: number;
  /**
   * This flag alone does not keep a post out of production: it drives a runtime
   * filter, and filtered text still ships. What keeps a draft out is where it is
   * listed — drafts.development.ts is compiled only by `ng serve`, development
   * builds, the tests and the staging build; published.ts is compiled by every build.
   * writing.spec.ts fails if the flag and the barrel disagree, and
   * scripts/check-dist.mjs fails a build that contains a draft.
   */
  published: boolean;
}

/** A post as the barrels list it: its info, plus how to fetch its body. */
export interface PostMeta extends PostInfo {
  /** Loads `posts/<slug>.ts` on demand, so each post is its own lazy chunk. */
  load: () => Promise<Block[]>;
}
