import { isDevMode } from '@angular/core';

import { DRAFT_POSTS } from './drafts';
import { PostMeta } from './post.model';
import { PUBLISHED_POSTS } from './published';

/**
 * Every post this build was compiled with: published ones first, then drafts.
 *
 * Which drafts that is gets decided at build time, exactly as for case studies.
 * `./drafts` is an empty list unless angular.json swaps in drafts.development.ts,
 * which only the development and staging configurations and the test target do. A
 * production bundle therefore doesn't contain a draft post at all.
 *
 * To add one: create `posts/<slug>.meta.ts` and `posts/<slug>.ts`, and list it in
 * drafts.development.ts. Move it to published.ts when it goes live.
 */
export const POSTS: readonly PostMeta[] = [...PUBLISHED_POSTS, ...DRAFT_POSTS];

/** A draft is only compiled in by a configuration that asked for it. */
function showsDrafts(): boolean {
  return DRAFT_POSTS.length > 0 || isDevMode();
}

/** Published posts, plus drafts in a build that was compiled with them. */
export function visiblePosts(includeDrafts: boolean = showsDrafts()): readonly PostMeta[] {
  return POSTS.filter(post => post.published || includeDrafts);
}

export function findPost(
  slug: string | null | undefined,
  includeDrafts: boolean = showsDrafts()
): PostMeta | undefined {
  if (!slug) return undefined;
  return visiblePosts(includeDrafts).find(post => post.slug === slug);
}
