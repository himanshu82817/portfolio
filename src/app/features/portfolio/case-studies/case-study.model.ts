/**
 * The shape of a case-study page.
 *
 * Deliberately strict: every section is required, so a half-written case study
 * fails to compile instead of shipping with a hole in it. Semantic checks the type
 * system can't express (dangling diagram edges, empty sections on a published
 * study) live in case-studies.spec.ts.
 *
 * To add a project: create `data/<slug>.ts` exporting a `CaseStudy`, then list it in
 * data/drafts.development.ts and put its assets in public-drafts/. Nothing else needs
 * to change until it is published — see `CaseStudy.published`.
 */

/**
 * How much of a system is the portfolio owner's work. Kept as data, not prose, so
 * the distinction between building something and working on something can't blur
 * as copy gets edited.
 */
export type Ownership =
  /** Designed and built from scratch. */
  | 'built'
  /** Now solely responsible for it, including systems inherited from others. */
  | 'owner'
  /** Added substantial features or reworked parts of an existing system. */
  | 'extended'
  /** One of several people working on it. */
  | 'contributed';

export const OWNERSHIP_LABEL: Record<Ownership, string> = {
  built: 'Designed & built',
  owner: 'Sole owner',
  extended: 'Extended',
  contributed: 'Contributed',
};

/** Column a node sits in on the architecture diagram, left to right. */
export type Tier = 'client' | 'edge' | 'service' | 'data' | 'external';

export interface DiagramNode {
  id: string;
  label: string;
  /** Usually the technology, e.g. "NestJS 11". */
  sublabel?: string;
  tier: Tier;
  /** Set on nodes that are the owner's work — drawn with an accent. */
  ownership?: Ownership;
}

export interface DiagramEdge {
  from: string;
  to: string;
  /** Protocol or purpose, kept short: "REST", "WebSocket", "webhook". */
  label?: string;
}

export interface Architecture {
  overview: string[];
  diagram: {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    caption: string;
  };
  components: {
    name: string;
    tech: string;
    responsibility: string;
    ownership?: Ownership;
  }[];
  flows: { name: string; steps: string[] }[];
}

/**
 * A technical decision, in the shape interviewers actually probe: not just what
 * was chosen, but what else was on the table and what it cost.
 */
export interface Decision {
  title: string;
  context: string;
  choice: string;
  why: string;
  alternatives: string[];
  tradeoff: string;
}

export interface Challenge {
  title: string;
  problem: string;
  approach: string;
  outcome: string;
}

/**
 * `measured` means observed on real hardware or traffic. `target` is a design
 * budget. `count` is a plain tally, like the number of modules. The page labels
 * each one accordingly — a budget is never presented as a result.
 */
export interface Metric {
  value: string;
  label: string;
  kind: 'measured' | 'target' | 'count';
  note?: string;
}

export interface CaseStudy {
  /** URL segment: /projects/<slug>. */
  slug: string;
  name: string;
  tagline: string;
  /** Short category label, e.g. "Personal product", "React Native SDK". */
  kind: string;
  engagement: 'personal' | 'contract' | 'employer';
  status: { label: string; tone: 'live' | 'beta' | 'building' | 'internal' };
  period: string;
  role: string;
  platforms: string[];
  cover: { src: string; alt: string };

  /**
   * Unpublished case studies exist only in development builds, where they render
   * with a draft banner and their open questions.
   *
   * This flag alone does not keep one out of production: it drives a runtime
   * filter, and filtered text still ships in the bundle. What keeps a draft out is
   * where it is listed. data/drafts.development.ts is compiled only by `ng serve`,
   * development builds, the tests and the staging build for the dev site;
   * data/published.ts is compiled by every build.
   * So publishing is three moves: set this to `true` (and empty `openQuestions`),
   * move the study from the first barrel to the second, and move its assets from
   * public-drafts/ to public/. case-studies.spec.ts fails if the flag and the barrel
   * disagree, and scripts/check-dist.mjs fails a build that contains a draft.
   */
  published: boolean;

  /** Shown near the top when the work is under a client agreement. */
  confidentiality?: string;

  summary: string[];
  problem: string[];
  ownership: {
    statement: string;
    collaborators?: { name: string; contribution: string }[];
  };
  architecture: Architecture;
  decisions: Decision[];
  features: { group: string; items: { name: string; detail: string }[] }[];
  challenges: Challenge[];
  metrics: Metric[];
  stack: { group: string; items: string[] }[];
  links: { label: string; url: string; kind: 'live' | 'repo' | 'store' | 'docs' }[];
  gallery: { src: string; alt: string; caption?: string }[];

  /**
   * Things only the owner can supply. Rendered as a checklist on draft pages only.
   * Internal notes: a published study must have none. A draft's are only ever
   * rendered by a development build; the staging build hides the panel, though
   * the text is still inside its bundle.
   */
  openQuestions: string[];

  seo: { title: string; description: string };
}
