import { isDevMode } from '@angular/core';

import { CaseStudy } from './case-study.model';
import { DRAFT_CASE_STUDIES } from './data/drafts';
import { PUBLISHED_CASE_STUDIES } from './data/published';

/**
 * Every case study this build was compiled with, in the order they appear on
 * /projects: published ones first, then drafts.
 *
 * Which drafts that is gets decided at build time, not here. `./data/drafts` is an
 * empty list unless angular.json swaps in data/drafts.development.ts, which only the
 * development and staging configurations and the test target do. A production bundle
 * therefore doesn't contain a draft at all — not its text, not its open questions.
 *
 * To add one: create `data/<slug>.ts` exporting a `CaseStudy`, and list it in
 * data/drafts.development.ts. Move it to data/published.ts when it goes live.
 */
export const CASE_STUDIES: readonly CaseStudy[] = [...PUBLISHED_CASE_STUDIES, ...DRAFT_CASE_STUDIES];

/**
 * Whether this build shows drafts unless told otherwise.
 *
 * A draft is only ever compiled in by a configuration that asked for it, so
 * "compiled in" and "meant to be seen" are the same thing. That is what lets the
 * staging build — an optimised build, where isDevMode() is false — list the drafts
 * on the dev site for review. isDevMode() still covers a development build that
 * happens to have no drafts left.
 */
function showsDrafts(): boolean {
  return DRAFT_CASE_STUDIES.length > 0 || isDevMode();
}

/**
 * Published case studies, plus drafts in a build that was compiled with them.
 *
 * This runtime filter is the second line of defence, not the first: it only hides a
 * draft, and hidden text still ships. What keeps a draft out of production is that it
 * was never compiled in — see CASE_STUDIES. The filter covers the one case that
 * leaves open, a study listed in data/published.ts while still `published: false`:
 * production compiles no drafts, so showsDrafts() is false there and it stays hidden.
 */
export function visibleCaseStudies(includeDrafts: boolean = showsDrafts()): readonly CaseStudy[] {
  return CASE_STUDIES.filter(study => study.published || includeDrafts);
}

export function findCaseStudy(
  slug: string | null | undefined,
  includeDrafts: boolean = showsDrafts()
): CaseStudy | undefined {
  if (!slug) return undefined;
  return visibleCaseStudies(includeDrafts).find(study => study.slug === slug);
}

/** The case study after `slug`, wrapping around. Undefined when there is only one. */
export function nextCaseStudy(
  slug: string,
  includeDrafts: boolean = showsDrafts()
): CaseStudy | undefined {
  const list = visibleCaseStudies(includeDrafts);
  const index = list.findIndex(study => study.slug === slug);
  if (index === -1 || list.length < 2) return undefined;
  return list[(index + 1) % list.length];
}
