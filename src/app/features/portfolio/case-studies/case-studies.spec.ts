import { CaseStudy } from './case-study.model';
import {
  CASE_STUDIES,
  findCaseStudy,
  nextCaseStudy,
  visibleCaseStudies,
} from './registry';

/**
 * Content rules the type system can't express. These run against the real case
 * study data, so a broken diagram or a half-finished page fails CI rather than
 * shipping.
 */
describe('case study content', () => {
  it('has unique, URL-safe slugs', () => {
    const slugs = CASE_STUDIES.map(study => study.slug);
    expect(new Set(slugs).size).withContext('duplicate slug').toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  for (const study of CASE_STUDIES) {
    describe(study.slug, () => {
      it('draws a diagram with unique node ids and no dangling edges', () => {
        const ids = study.architecture.diagram.nodes.map(node => node.id);
        expect(new Set(ids).size).withContext('duplicate node id').toBe(ids.length);

        for (const edge of study.architecture.diagram.edges) {
          expect(ids)
            .withContext(`edge ${edge.from} → ${edge.to} starts at an unknown node`)
            .toContain(edge.from);
          expect(ids)
            .withContext(`edge ${edge.from} → ${edge.to} ends at an unknown node`)
            .toContain(edge.to);
        }
      });

      it('states what was weighed and what it cost for every decision', () => {
        for (const decision of study.decisions) {
          expect(decision.alternatives.length)
            .withContext(`"${decision.title}" lists no alternatives`)
            .toBeGreaterThan(0);
          expect(decision.tradeoff.trim())
            .withContext(`"${decision.title}" has no trade-off`)
            .not.toBe('');
          expect(decision.why.trim())
            .withContext(`"${decision.title}" has no rationale`)
            .not.toBe('');
        }
      });

      it('carries a confidentiality note when it is client work', () => {
        if (study.engagement === 'contract') {
          expect(study.confidentiality?.trim())
            .withContext('contract work must say what can and cannot be shared')
            .toBeTruthy();
        } else {
          expect(true).toBeTrue();
        }
      });

      it('uses root-relative asset paths and absolute https links', () => {
        expect(study.cover.src.startsWith('/')).withContext('cover.src').toBeTrue();
        for (const image of study.gallery) {
          expect(image.src.startsWith('/')).withContext(image.src).toBeTrue();
        }
        for (const link of study.links) {
          expect(link.url).withContext(link.label).toMatch(/^https:\/\//);
        }
      });

      if (study.published) {
        it('is complete enough to publish', () => {
          assertPublishable(study);
        });
      }
    });
  }
});

function assertPublishable(study: CaseStudy): void {
  const required: [string, unknown[]][] = [
    ['summary', study.summary],
    ['problem', study.problem],
    ['architecture.overview', study.architecture.overview],
    ['architecture.components', study.architecture.components],
    ['decisions', study.decisions],
    ['features', study.features],
    ['challenges', study.challenges],
    ['stack', study.stack],
  ];
  for (const [name, section] of required) {
    expect(section.length).withContext(`published study has empty ${name}`).toBeGreaterThan(0);
  }
  expect(study.openQuestions)
    .withContext('published study still has open questions')
    .toEqual([]);
}

describe('case study registry', () => {
  it('hides drafts from production builds and shows them in development', () => {
    const drafts = CASE_STUDIES.filter(study => !study.published);

    for (const draft of drafts) {
      expect(visibleCaseStudies(false)).not.toContain(draft);
      expect(findCaseStudy(draft.slug, false))
        .withContext(`${draft.slug} must not route in production`)
        .toBeUndefined();

      expect(visibleCaseStudies(true)).toContain(draft);
      expect(findCaseStudy(draft.slug, true)).toBe(draft);
    }
  });

  it('returns nothing for an unknown or empty slug', () => {
    expect(findCaseStudy('no-such-project', true)).toBeUndefined();
    expect(findCaseStudy('', true)).toBeUndefined();
    expect(findCaseStudy(null, true)).toBeUndefined();
  });

  it('links to the next case study, wrapping around, and never to itself', () => {
    const list = visibleCaseStudies(true);
    const last = list[list.length - 1];

    if (list.length < 2) {
      expect(nextCaseStudy(last.slug, true)).toBeUndefined();
    } else {
      expect(nextCaseStudy(list[0].slug, true)).toBe(list[1]);
      expect(nextCaseStudy(last.slug, true)).toBe(list[0]);
    }
  });
});
