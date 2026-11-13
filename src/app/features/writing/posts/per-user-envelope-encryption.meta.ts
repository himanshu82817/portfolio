import type { PostInfo } from '../post.model';

export const META: PostInfo = {
  slug: 'per-user-envelope-encryption',
  title: 'Per-user envelope encryption with Cloud KMS, rolled out without downtime',
  description:
    'How LifeBoard seals what people write before it reaches MongoDB, and how it was ' +
    'turned on for existing data without a migration window.',
  date: '2026-11-12',
  tags: ['Encryption', 'GCP', 'Cloud KMS', 'NestJS', 'MongoDB'],
  readingMinutes: 8,
  published: false,
};
