import { isDevMode } from '@angular/core';

import { PostMeta } from './post.model';

/**
 * Every post, newest first.
 *
 * To add one: create `posts/<slug>.ts` exporting `BODY: Block[]`, and add its
 * metadata here. Set `published: true` once it has been checked.
 */
export const POSTS: readonly PostMeta[] = [
  {
    slug: 'reminders-on-cloud-run',
    title: 'A timer is not a clock on Cloud Run',
    description:
      'Why setInterval silently fails on a scale-to-zero service, and how LifeBoard ' +
      'delivers reminders exactly once with Cloud Scheduler, an OIDC-guarded endpoint ' +
      'and a unique index.',
    date: '2026-11-12',
    tags: ['GCP', 'Cloud Run', 'NestJS', 'MongoDB', 'Web Push'],
    readingMinutes: 9,
    published: false,
    load: () => import('./posts/reminders-on-cloud-run').then(m => m.BODY),
  },
  {
    slug: 'per-user-envelope-encryption',
    title: 'Per-user envelope encryption with Cloud KMS, rolled out without downtime',
    description:
      'How LifeBoard seals what people write before it reaches MongoDB, and how it was ' +
      'turned on for existing data without a migration window.',
    date: '2026-11-12',
    tags: ['Encryption', 'GCP', 'Cloud KMS', 'NestJS', 'MongoDB'],
    readingMinutes: 8,
    published: false,
    load: () => import('./posts/per-user-envelope-encryption').then(m => m.BODY),
  },
];

/** Published posts, plus drafts when running a development build. */
export function visiblePosts(includeDrafts: boolean = isDevMode()): readonly PostMeta[] {
  return POSTS.filter(post => post.published || includeDrafts);
}

export function findPost(
  slug: string | null | undefined,
  includeDrafts: boolean = isDevMode()
): PostMeta | undefined {
  if (!slug) return undefined;
  return visiblePosts(includeDrafts).find(post => post.slug === slug);
}
