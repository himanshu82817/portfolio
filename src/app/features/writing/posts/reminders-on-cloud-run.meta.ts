import type { PostInfo } from '../post.model';

export const META: PostInfo = {
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
};
