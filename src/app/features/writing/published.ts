import { PostMeta } from './post.model';

/**
 * Published posts, newest first. Everything listed here ships in every build,
 * production included — so only a post with `published: true` belongs here. Drafts
 * go in drafts.development.ts.
 */
export const PUBLISHED_POSTS: readonly PostMeta[] = [];
