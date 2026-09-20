import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { BackdropComponent } from './backdrop.component';

describe('BackdropComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    // Light theme, a hovering mouse, no reduced-motion preference.
    spyOn(window, 'matchMedia').and.callFake(
      (query: string) =>
        ({
          matches: query.includes('hover'),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList
    );
    TestBed.configureTestingModule({ imports: [BackdropComponent] });
  });

  afterEach(() => {
    document.body.classList.remove('has-canvas');
  });

  function create(): HTMLElement {
    const fixture = TestBed.createComponent(BackdropComponent);
    fixture.detectChanges();
    // afterNextRender hooks run with the application tick, not the fixture.
    TestBed.inject(ApplicationRef).tick();
    return fixture.nativeElement;
  }

  it('stays out of the accessibility tree', () => {
    const el = create();
    expect(el.querySelector('.backdrop')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('splashes ink where the visitor clicks in light mode', () => {
    const el = create();
    window.dispatchEvent(
      new PointerEvent('pointerdown', {
        clientX: 40,
        clientY: 50,
        isPrimary: true,
        button: 0,
        pointerType: 'mouse',
      })
    );

    const ripple = el.querySelector('.backdrop__ripple');
    expect(ripple).withContext('a click should leave a mark').toBeTruthy();
    expect(ripple!.querySelectorAll('i').length).toBe(6);
  });

  it('ignores secondary mouse buttons', () => {
    const el = create();
    window.dispatchEvent(
      new PointerEvent('pointerdown', { isPrimary: true, button: 2, pointerType: 'mouse' })
    );
    expect(el.querySelector('.backdrop__ripple')).toBeNull();
  });

  it('parks the ink reveal under the pointer, keeping the tile registered', done => {
    const el = create();
    window.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 300, clientY: 200, pointerType: 'mouse' })
    );

    requestAnimationFrame(() => {
      const reveal = el.querySelector<HTMLElement>('.backdrop__reveal')!;
      expect(reveal.classList).toContain('is-active');
      // The square is centred on the pointer, and its background is shifted by
      // the opposite amount so the doodles do not appear to slide.
      const half = reveal.offsetWidth / 2;
      expect(reveal.style.transform).toBe(`translate3d(${300 - half}px, ${200 - half}px, 0px)`);
      expect(reveal.style.backgroundPosition).toBe(`${-(300 - half)}px ${-(200 - half)}px`);
      done();
    });
  });

  it('places a tap inside the backdrop box, which is taller than the screen while a phone’s URL bar shows', done => {
    const el = create();
    const box = el.querySelector<HTMLElement>('.backdrop')!;
    // The box hangs from the bottom of the viewport at the large-viewport height,
    // so with a 56px URL bar showing, its top edge is 56px above the visible area.
    const bar = 56;
    box.style.height = `${window.innerHeight + bar}px`;

    // The component learns the new size from its ResizeObserver, a frame later.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        window.dispatchEvent(
          new PointerEvent('pointerdown', {
            clientX: 40,
            clientY: 100,
            isPrimary: true,
            button: 0,
            pointerType: 'touch',
          })
        );

        const ripple = el.querySelector('.backdrop__ripple')!;
        const effect = ripple.getAnimations()[0].effect as KeyframeEffect;
        expect(String(effect.getKeyframes()[0]['transform']))
          .withContext('100px down the screen is 156px down the box')
          .toContain(`translate(40px, ${100 + bar}px)`);
        done();
      })
    );
  });
});
