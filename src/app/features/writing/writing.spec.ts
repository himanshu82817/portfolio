import { isInternal, parseInline } from './inline';
import { DRAFT_POSTS as DEVELOPMENT_DRAFTS } from './drafts.development';
import { PUBLISHED_POSTS } from './published';
import { POSTS, findPost, visiblePosts } from './registry';

describe('inline text', () => {
  it('splits code, bold, emphasis and links out of plain text', () => {
    expect(parseInline('Use `seal` to **lock** a *value*, see [docs](https://example.com).')).toEqual([
      { kind: 'text', text: 'Use ' },
      { kind: 'code', text: 'seal' },
      { kind: 'text', text: ' to ' },
      { kind: 'strong', text: 'lock' },
      { kind: 'text', text: ' a ' },
      { kind: 'em', text: 'value' },
      { kind: 'text', text: ', see ' },
      { kind: 'link', text: 'docs', href: 'https://example.com' },
      { kind: 'text', text: '.' },
    ]);
  });

  it('leaves asterisks inside code alone', () => {
    expect(parseInline('`a * b * c`')).toEqual([{ kind: 'code', text: 'a * b * c' }]);
  });

  it('returns plain text unchanged', () => {
    expect(parseInline('Nothing special here.')).toEqual([
      { kind: 'text', text: 'Nothing special here.' },
    ]);
  });

  it('treats only root-relative links as internal', () => {
    expect(isInternal('/writing/a-post')).toBeTrue();
    expect(isInternal('https://example.com')).toBeFalse();
    expect(isInternal('//example.com')).toBeFalse();
  });
});

/**
 * A draft stays out of production because it is listed in a file production never
 * compiles, not because of its `published` flag. These keep the two in step. The
 * bytes of a real build are checked separately, by scripts/check-dist.mjs.
 */
describe('post barrels', () => {
  it('lists only published posts in the barrel that ships with every build', () => {
    for (const post of PUBLISHED_POSTS) {
      expect(post.published)
        .withContext(`${post.slug} is in published.ts, so it ships to production, but it is not published`)
        .toBeTrue();
    }
  });

  it('lists only unpublished posts in the development-only barrel', () => {
    for (const post of DEVELOPMENT_DRAFTS) {
      expect(post.published)
        .withContext(`${post.slug} is published but still in drafts.development.ts, so production leaves it out`)
        .toBeFalse();
    }
  });

  it('gives this test build every draft, so the content checks below are not vacuous', () => {
    const compiled = POSTS.map(post => post.slug);
    for (const draft of DEVELOPMENT_DRAFTS) {
      expect(compiled)
        .withContext('the test target in angular.json must swap writing/drafts.ts for writing/drafts.development.ts')
        .toContain(draft.slug);
    }
  });
});

describe('post registry', () => {
  it('has unique, URL-safe slugs and real dates', () => {
    const slugs = POSTS.map(post => post.slug);
    expect(new Set(slugs).size).withContext('duplicate slug').toBe(slugs.length);
    for (const post of POSTS) {
      expect(post.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(post.date).getTime())).toBeFalse();
    }
  });

  it('hides drafts from production builds and shows them in development', () => {
    for (const draft of POSTS.filter(post => !post.published)) {
      expect(visiblePosts(false)).not.toContain(draft);
      expect(findPost(draft.slug, false))
        .withContext(`${draft.slug} must not route in production`)
        .toBeUndefined();

      expect(visiblePosts(true)).toContain(draft);
      expect(findPost(draft.slug, true)).toBe(draft);
    }
  });

  it('returns nothing for an unknown or empty slug', () => {
    expect(findPost('no-such-post', true)).toBeUndefined();
    expect(findPost('', true)).toBeUndefined();
    expect(findPost(null, true)).toBeUndefined();
  });

  for (const post of POSTS) {
    it(`${post.slug} loads a body that opens with prose and has no empty blocks`, async () => {
      const body = await post.load();
      expect(body.length).toBeGreaterThan(0);
      expect(body[0].kind).toBe('paragraph');

      for (const block of body) {
        if (block.kind === 'paragraph' || block.kind === 'heading') {
          expect(block.text.trim()).not.toBe('');
        } else if (block.kind === 'list') {
          expect(block.items.length).toBeGreaterThan(0);
        } else if (block.kind === 'code') {
          expect(block.code.trim()).not.toBe('');
        } else {
          for (const row of block.rows) {
            expect(row.length).withContext('table row width').toBe(block.head.length);
          }
        }
      }
    });
  }
});
