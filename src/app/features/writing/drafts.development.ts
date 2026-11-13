import { PostMeta } from './post.model';
import { META as ENCRYPTION } from './posts/per-user-envelope-encryption.meta';
import { META as REMINDERS } from './posts/reminders-on-cloud-run.meta';

/**
 * Unpublished posts, newest first. Compiled in place of drafts.ts by `ng serve`,
 * development builds, the unit tests and the staging build that the dev site runs —
 * never by a production build. See drafts.ts for why.
 *
 * To publish one: set `published: true` in its `.meta.ts`, move its entry from here
 * to published.ts, and add its URL to public/sitemap.xml. writing.spec.ts fails if
 * the flag and the barrel disagree.
 */
export const DRAFT_POSTS: readonly PostMeta[] = [
  {
    ...REMINDERS,
    load: () => import('./posts/reminders-on-cloud-run').then(m => m.BODY),
  },
  {
    ...ENCRYPTION,
    load: () => import('./posts/per-user-envelope-encryption').then(m => m.BODY),
  },
];
