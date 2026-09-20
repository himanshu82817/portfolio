import { CaseStudy } from '../case-study.model';

/**
 * Published case studies, in the order they appear on /projects. Everything listed
 * here ships in every build, production included — so only a study with
 * `published: true` belongs here. Drafts go in drafts.development.ts.
 */
export const PUBLISHED_CASE_STUDIES: readonly CaseStudy[] = [];
