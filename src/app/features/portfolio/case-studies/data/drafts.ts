import { CaseStudy } from '../case-study.model';

/**
 * Unpublished case studies — none, on purpose. This is the file every build compiles
 * unless it opts in, so a draft's text is never in a bundle that reaches a server.
 *
 * The drafts themselves are listed in drafts.development.ts. angular.json swaps that
 * file in for this one (`fileReplacements`) in the development configuration, the
 * test target, and the staging configuration — the one deployed build that asks for
 * them, so they can be reviewed on the dev site. Nowhere else: a new build
 * configuration gets no drafts until it asks for them. Hiding a draft at runtime is not enough — the site is public, and
 * so is every byte of its JavaScript.
 *
 * Leave this array empty. scripts/check-dist.mjs fails the build if a draft ships.
 */
export const DRAFT_CASE_STUDIES: readonly CaseStudy[] = [];
