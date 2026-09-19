import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CaseStudyComponent } from './case-study.component';
import { CASE_STUDIES } from './registry';

describe('CaseStudyComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseStudyComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function render(slug: string): HTMLElement {
    const fixture = TestBed.createComponent(CaseStudyComponent);
    fixture.componentRef.setInput('slug', slug);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  for (const study of CASE_STUDIES) {
    describe(study.slug, () => {
      it('renders the name as the page’s only h1', () => {
        const el = render(study.slug);
        const headings = el.querySelectorAll('h1');
        expect(headings.length).toBe(1);
        expect(headings[0].textContent?.trim()).toBe(study.name);
      });

      it('links only to sections that have content', () => {
        const el = render(study.slug);
        const links = Array.from(
          el.querySelectorAll<HTMLAnchorElement>('nav[aria-label="On this page"] a')
        ).map(a => a.textContent?.trim());

        expect(links.includes('Decisions')).toBe(study.decisions.length > 0);
        expect(links.includes('Features')).toBe(study.features.length > 0);
        expect(links.includes('Hard problems')).toBe(study.challenges.length > 0);
        expect(links.includes('Screens')).toBe(study.gallery.length > 0);

        // Every link must have a matching section to land on.
        for (const anchor of el.querySelectorAll<HTMLAnchorElement>(
          'nav[aria-label="On this page"] a'
        )) {
          const fragment = new URL(anchor.href).hash.slice(1);
          expect(el.querySelector(`#${fragment}`))
            .withContext(`"${anchor.textContent?.trim()}" points at a missing section`)
            .toBeTruthy();
        }
      });

      it('shows the draft banner exactly when unpublished', () => {
        const el = render(study.slug);
        const banner = el.querySelector('[role="note"]');
        expect(!!banner).toBe(!study.published);
      });

      it('labels design targets so they are never read as measured results', () => {
        const el = render(study.slug);
        const targets = study.metrics.filter(metric => metric.kind === 'target');
        const labels = el.textContent?.match(/Design target/g) ?? [];
        expect(labels.length).toBe(targets.length);
      });
    });
  }

  it('renders nothing for a slug that does not exist', () => {
    const el = render('no-such-project');
    expect(el.querySelector('article')).toBeNull();
  });
});
