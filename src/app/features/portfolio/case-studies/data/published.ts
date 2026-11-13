import { CaseStudy } from '../case-study.model';
import { FLIPTOE_PLATFORM } from './fliptoe-platform';
import { FLIPTOEFACE } from './fliptoeface';
import { LIFEBOARD } from './lifeboard';

/**
 * Published case studies, in the order they appear on /projects. Everything listed
 * here ships in every build, production included — so only a study with
 * `published: true` belongs here. Drafts go in drafts.development.ts.
 */
export const PUBLISHED_CASE_STUDIES: readonly CaseStudy[] = [LIFEBOARD, FLIPTOE_PLATFORM, FLIPTOEFACE];
