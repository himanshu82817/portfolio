import { CaseStudy } from '../case-study.model';

/**
 * Unpublished case studies, in the order they appear on /projects. Compiled in place
 * of drafts.ts by `ng serve`, development builds, the unit tests and the staging
 * build that the dev site runs — never by a production build. See drafts.ts for why.
 *
 * None at the moment: all three studies are in published.ts. A new one starts here.
 *
 * To publish one: set `published: true` and empty its `openQuestions`, move its
 * import from here to published.ts, and move its assets from public-drafts/ to
 * public/. case-studies.spec.ts fails if the flag and the barrel disagree.
 */
export const DRAFT_CASE_STUDIES: readonly CaseStudy[] = [];
