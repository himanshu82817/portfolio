import { CanMatchFn, ResolveFn } from '@angular/router';
import type { RouteSeo } from '../../../core/services/seo.service';

/**
 * These are referenced from app.routes.ts, which is part of the initial bundle.
 * The registry is imported dynamically so the case-study content itself stays in
 * a lazy chunk and is only downloaded when someone opens a project.
 */
const loadRegistry = () => import('./registry');

/**
 * Only match /projects/:slug for a slug that exists and is visible in this build.
 * Anything else falls through to the ** route and renders the 404 page, rather
 * than an empty case-study shell.
 */
export const caseStudyExists: CanMatchFn = (_route, segments) =>
  loadRegistry().then(registry => !!registry.findCaseStudy(segments[1]?.path));

/** Feeds the per-project title and description to SeoService via route data. */
export const caseStudySeo: ResolveFn<RouteSeo> = route =>
  loadRegistry().then(registry => {
    const study = registry.findCaseStudy(route.paramMap.get('slug'));
    return study ? study.seo : { title: 'Project', description: '' };
  });
