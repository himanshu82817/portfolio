import { isDevMode } from '@angular/core';

import { CaseStudy } from './case-study.model';
import { FLIPTOE_PLATFORM } from './data/fliptoe-platform';
import { FLIPTOEFACE } from './data/fliptoeface';
import { LIFEBOARD } from './data/lifeboard';

/**
 * Every case study, in the order they appear on /projects.
 *
 * To add one: create `data/<slug>.ts` exporting a `CaseStudy`, and add it here.
 */
export const CASE_STUDIES: readonly CaseStudy[] = [LIFEBOARD, FLIPTOE_PLATFORM, FLIPTOEFACE];

/**
 * Published case studies, plus drafts when running a development build.
 * Production builds never see a draft, so one can't go live by accident.
 */
export function visibleCaseStudies(includeDrafts: boolean = isDevMode()): readonly CaseStudy[] {
  return CASE_STUDIES.filter(study => study.published || includeDrafts);
}

export function findCaseStudy(
  slug: string | null | undefined,
  includeDrafts: boolean = isDevMode()
): CaseStudy | undefined {
  if (!slug) return undefined;
  return visibleCaseStudies(includeDrafts).find(study => study.slug === slug);
}

/** The case study after `slug`, wrapping around. Undefined when there is only one. */
export function nextCaseStudy(
  slug: string,
  includeDrafts: boolean = isDevMode()
): CaseStudy | undefined {
  const list = visibleCaseStudies(includeDrafts);
  const index = list.findIndex(study => study.slug === slug);
  if (index === -1 || list.length < 2) return undefined;
  return list[(index + 1) % list.length];
}
