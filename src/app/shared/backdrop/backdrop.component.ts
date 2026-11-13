import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  effect,
  inject,
  viewChild,
} from '@angular/core';

import { ThemeService } from '../../core/services/theme.service';
import { BlackHoleHandle, createBlackHole } from './black-hole';

/** Device pixels per CSS pixel the canvas may render. Above this the fragment
 *  shader's cost grows faster than anything a backdrop can justify. */
const MAX_DPR = 1.5;

/** GPU milliseconds the one frame may cost before the render scale steps down. */
const FRAME_BUDGET_MS = 5;

/** How long to let the page settle before timing the GPU: first paint, image
 *  decodes and Angular's bootstrap all compete for it. */
const SETTLE_MS = 1000;

/**
 * The hole rises out of the bottom edge: centred, cut in half by the screen,
 * kept low, with a wide flat disk that spans the full width (the shadow radius
 * is a fraction of the width; the disk reaches 9.6 radii, fading over the last
 * 2.4). The bottom nav pill floats over the shadow.
 */
const HOLE_LAYOUT = { center: [0.5, 1] as [number, number], scale: 0.065 };

/**
 * The scripted half of the theme backdrop. The static half — paper, doodles,
 * star tiles — is painted by CSS on <body> (styles.css) so it is there before
 * Angular boots. This component adds the one thing that needs script: in dark
 * mode, the WebGL black hole (black-hole.ts), drawn as a single still frame.
 *
 * The backdrop is deliberately quiet. It used to follow the pointer, splash ink
 * on click and animate the sky; all of that competed with the text it sits
 * behind. Now nothing in it moves and nothing in it reacts — it is scenery, and
 * the page is for reading. Light mode needs no script at all.
 */
@Component({
  selector: 'app-backdrop',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #root class="backdrop" aria-hidden="true">
      <canvas #canvas class="backdrop__canvas" hidden></canvas>
    </div>
  `,
})
export class BackdropComponent {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly theme = inject(ThemeService);

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private ready = false;
  private hole: BlackHoleHandle | null = null;
  private liveTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Size of the backdrop box in CSS pixels. Not the window's: the box hangs from
   * the bottom of the viewport at the large-viewport height (.backdrop in
   * styles.css), so on a phone it does not change when the URL bar moves.
   */
  private width = 0;
  private height = 0;

  /** Multiplies the device pixel ratio; stepped down by calibrate() and never
   *  back up, so a slow machine settles instead of oscillating. */
  private quality = 1;
  /** Viewport area the current quality was measured at. */
  private calibratedArea = 0;
  private calibrateTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Theme changes arrive through the signal; the first application waits for
    // the view so the canvas exists.
    effect(() => {
      const dark = this.theme.darkMode();
      if (this.ready) this.zone.runOutsideAngular(() => this.applyTheme(dark));
    });

    afterNextRender(() => {
      this.zone.runOutsideAngular(() => {
        this.watchSize();
        this.ready = true;
        this.applyTheme(this.theme.darkMode());
      });
    });

    this.destroyRef.onDestroy(() => {
      if (this.ready) this.stopHole();
    });
  }

  /** The box is watched rather than the window, which on a phone fires `resize`
   *  every time the URL bar moves — while this box stays exactly the same size. */
  private watchSize(): void {
    const root = this.root().nativeElement;
    this.setSize(root.clientWidth, root.clientHeight);
    const observer = new ResizeObserver(([entry]) =>
      this.setSize(entry.contentRect.width, entry.contentRect.height)
    );
    observer.observe(root);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private setSize(width: number, height: number): void {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.onResize();
  }

  private applyTheme(dark: boolean): void {
    if (dark) this.startHole();
    else this.stopHole();
  }

  private startHole(): void {
    if (this.hole) return;

    const canvas = this.canvas().nativeElement;
    // Always 'still': one frame, kept. No clock, no pointer, no animation loop.
    this.hole = createBlackHole(canvas, { ...HOLE_LAYOUT, motion: 'still' });
    if (!this.hole) return; // no WebGL — the CSS star field stays as it is

    canvas.hidden = false;
    this.calibratedArea = 0;
    this.onResize();

    // The canvas fades in over the CSS sky; once it is opaque the CSS stars
    // beneath are switched off rather than left compositing under it.
    requestAnimationFrame(() => canvas.classList.add('is-live'));
    this.liveTimer = setTimeout(() => document.body.classList.add('has-canvas'), 700);

    this.hole.frame(0);
  }

  private stopHole(): void {
    clearTimeout(this.liveTimer);
    clearTimeout(this.calibrateTimer);
    document.body.classList.remove('has-canvas');
    this.hole?.dispose();
    this.hole = null;

    const canvas = this.canvas().nativeElement;
    canvas.hidden = true;
    canvas.classList.remove('is-live');
  }

  private onResize(): void {
    if (!this.hole || !this.width || !this.height) return;

    this.hole.resize(this.width, this.height, this.dpr());
    this.hole.frame(0);

    // Re-measure when the canvas has grown well past what was last measured —
    // a phone rotated to landscape, a window dragged to a larger monitor.
    if (this.width * this.height > this.calibratedArea * 1.5) {
      clearTimeout(this.calibrateTimer);
      this.calibrateTimer = setTimeout(() => this.calibrate(), SETTLE_MS);
    }
  }

  /**
   * Times the shader at the current size and lowers the render scale until one
   * frame fits the budget. Even a still frame is redrawn on every resize, and a
   * frame that takes a quarter of a second makes dragging a window stutter.
   */
  private calibrate(): void {
    if (!this.hole) return;
    this.calibratedArea = this.width * this.height;

    const sample = () => Math.min(this.hole!.measure(), this.hole!.measure());
    let ms = sample();
    while (ms > FRAME_BUDGET_MS && this.quality > 0.45) {
      this.quality *= 0.75;
      this.hole.resize(this.width, this.height, this.dpr());
      ms = sample();
    }
    this.hole.frame(0);
  }

  private dpr(): number {
    return Math.min(window.devicePixelRatio || 1, MAX_DPR) * this.quality;
  }
}
