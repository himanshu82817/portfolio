import { CanMatchFn, ResolveFn } from '@angular/router';

import type { RouteSeo } from '../../core/services/seo.service';
import { findPost, visiblePosts } from './registry';

/**
 * /writing only exists while there is something to read. With every post still a
 * draft, a production build has no Writing page at all — the route falls through
 * to the 404 page and the navbar shows no link.
 */
export const hasPosts: CanMatchFn = () => visiblePosts().length > 0;

/** Only match /writing/:slug for a post that is visible in this build. */
export const postExists: CanMatchFn = (_route, segments) => !!findPost(segments[1]?.path);

export const postSeo: ResolveFn<RouteSeo> = route => {
  const post = findPost(route.paramMap.get('slug'));
  return post
    ? { title: post.title, description: post.description }
    : { title: 'Writing', description: '' };
};
