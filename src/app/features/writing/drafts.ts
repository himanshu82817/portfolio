import { PostMeta } from './post.model';

/**
 * Unpublished posts — none, on purpose. This is the file every build compiles unless
 * it opts in, so a draft's text is never in a bundle that reaches a production server.
 *
 * The drafts themselves are listed in drafts.development.ts. angular.json swaps that
 * file in for this one (`fileReplacements`) in the development and staging
 * configurations and the test target, the same way it does for case studies.
 *
 * Leave this array empty. scripts/check-dist.mjs fails the build if a draft ships.
 */
export const DRAFT_POSTS: readonly PostMeta[] = [];
