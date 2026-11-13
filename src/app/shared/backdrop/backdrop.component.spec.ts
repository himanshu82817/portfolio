import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { BackdropComponent } from './backdrop.component';

describe('BackdropComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
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
    const root = create().querySelector('.backdrop') as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
  });

  it('draws nothing in light mode: the paper is plain CSS', () => {
    const el = create();
    const canvas = el.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.hidden).toBeTrue();
    expect(document.body.classList.contains('has-canvas')).toBeFalse();
  });

  it('does not react to the pointer: the backdrop is scenery, not an interaction', () => {
    const el = create();
    const root = el.querySelector('.backdrop') as HTMLElement;
    const before = root.innerHTML;

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 200 }));
    window.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 300, clientY: 200, isPrimary: true, button: 0 })
    );

    expect(root.innerHTML).withContext('no ripple, reveal or other element may appear').toBe(before);
    expect(root.querySelector('.backdrop__ripple')).toBeNull();
  });

  it('never starts an animation loop', () => {
    const raf = spyOn(window, 'requestAnimationFrame').and.callThrough();
    create();
    // Light mode schedules nothing at all; dark mode only fades the canvas in once.
    expect(raf.calls.count()).toBeLessThanOrEqual(1);
  });
});
