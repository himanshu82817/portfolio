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

/** GPU milliseconds per frame the backdrop may spend — under a third of a
 *  60 Hz frame, so the page keeps the rest. Beyond it the render scale steps
 *  down. */
const FRAME_BUDGET_MS = 5;

/** Frames to let the page settle before timing the GPU: first paint, image
 *  decodes and Angular's bootstrap all compete for it, and a measurement taken
 *  in that crush under-reports what the GPU can do by half or more. */
const SETTLE_FRAMES = 30;

/**
 * The hole rises out of the bottom edge: centred, cut in half by the screen,
 * kept low, with a wide flat disk that spans the full width (the shadow radius
 * is a fraction of the width; the disk reaches 9.6 radii, fading over the last
 * 2.4). The bottom nav pill floats over the shadow.
 */
const HOLE_LAYOUT = { center: [0.5, 1] as [number, number], scale: 0.065 };

/**
 * The interactive half of the theme backdrop. The static half — paper,
 * doodles, star tiles — is painted by CSS on <body> (styles.css) so it is there
 * before Angular boots; this component layers on the parts that need script:
 *
 * - light: an "ink reveal" that darkens the doodles around the pointer, and an
 *   ink splash where the visitor clicks;
 * - dark: the WebGL black hole (black-hole.ts), fed the pointer for parallax
 *   and clicks for gravitational ripples — or a plain ripple when WebGL is
 *   unavailable.
 *
 * Everything runs outside Angular's zone: pointer events at the rate a mouse
 * produces them would otherwise trigger change detection on every move.
 */
@Component({
  selector: 'app-backdrop',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #root class="backdrop" aria-hidden="true">
      <div #reveal class="backdrop__reveal"></div>
      <canvas #canvas class="backdrop__canvas" hidden></canvas>
    </div>
  `,
})
export class BackdropComponent {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly theme = inject(ThemeService);

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly reveal = viewChild.required<ElementRef<HTMLElement>>('reveal');
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** The reveal follows a hovering pointer; a finger has nothing to follow. */
  private readonly canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  private ready = false;
  private dark = false;
  private hole: BlackHoleHandle | null = null;
  private frameId = 0;
  private revealId = 0;
  private liveTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly pointer = { x: -1, y: -1, inside: false };

  /** Cached because reading offsetWidth on every pointer move forces layout. */
  private revealHalf = 0;

  /** Multiplies the device pixel ratio; stepped down by calibrate() and never
   *  back up, so a slow machine settles instead of oscillating. */
  private quality = 1;
  /** Viewport area the current quality was measured at. */
  private calibratedArea = 0;
  /** Frames left before the next calibration; 0 means none is pending. */
  private settleFrames = 0;
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
        this.listen();
        this.ready = true;
        this.applyTheme(this.theme.darkMode());
      });
    });

    this.destroyRef.onDestroy(() => {
      if (this.ready) this.stopHole();
    });
  }

  private listen(): void {
    const on = (target: EventTarget, type: string, handler: EventListener) => {
      target.addEventListener(type, handler, { passive: true });
      this.destroyRef.onDestroy(() => target.removeEventListener(type, handler));
    };

    on(window, 'pointermove', e => this.onMove(e as PointerEvent));
    on(window, 'pointerdown', e => this.onDown(e as PointerEvent));
    on(window, 'resize', () => this.onResize());
    on(window, 'blur', () => this.leave());
    on(document.documentElement, 'pointerleave', () => this.leave());
    on(document, 'visibilitychange', () => this.onVisibility());
  }

  private applyTheme(dark: boolean): void {
    this.dark = dark;
    if (dark) {
      this.hideReveal();
      this.startHole();
    } else {
      this.stopHole();
    }
  }

  // Pointer ------------------------------------------------------------------

  private onMove(e: PointerEvent): void {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
    this.pointer.inside = true;

    // The reveal is CSS-hidden in dark mode; skipping the frame keeps it from
    // being positioned for nothing.
    if (this.dark || !this.canHover || this.revealId) return;
    this.revealId = requestAnimationFrame(() => {
      this.revealId = 0;
      this.paintReveal();
    });
  }

  private onDown(e: PointerEvent): void {
    if (this.reducedMotion || !e.isPrimary) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    if (this.hole) this.hole.pulse(e.clientX, e.clientY);
    else this.splash(e.clientX, e.clientY);
  }

  private leave(): void {
    this.pointer.inside = false;
    this.hideReveal();
  }

  // Light: ink reveal + splash -------------------------------------------------

  /**
   * A square of the doodle tile, masked to a soft disc, that rides under the
   * pointer. Its background is offset by exactly the square's own position so
   * the tile stays registered with the static layer beneath — the doodles look
   * like they darken in place rather than a picture sliding around.
   */
  private paintReveal(): void {
    const el = this.reveal().nativeElement;
    if (!this.revealHalf) this.revealHalf = el.offsetWidth / 2;

    const x = this.pointer.x - this.revealHalf;
    const y = this.pointer.y - this.revealHalf;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    el.style.backgroundPosition = `${-x}px ${-y}px`;
    el.classList.add('is-active');
  }

  private hideReveal(): void {
    if (this.revealId) {
      cancelAnimationFrame(this.revealId);
      this.revealId = 0;
    }
    this.reveal().nativeElement.classList.remove('is-active');
  }

  /**
   * One expanding ring carrying a few ink dots: scaling the ring throws the
   * dots outward, so a click costs a single animation rather than seven.
   */
  private splash(x: number, y: number): void {
    const root = this.root().nativeElement;
    const live = root.getElementsByClassName('backdrop__ripple');
    if (live.length >= 6) live[0].remove();

    const ring = document.createElement('span');
    ring.className = 'backdrop__ripple';
    for (let i = 0; i < 6; i++) {
      const dot = document.createElement('i');
      const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.7;
      const radius = 32 + Math.random() * 28;
      const dx = Math.cos(angle) * radius;
      const dy = Math.sin(angle) * radius;
      dot.style.transform = `translate(${dx}px, ${dy}px)`;
      ring.appendChild(dot);
    }
    root.appendChild(ring);

    const at = `translate(${x}px, ${y}px)`;
    const remove = () => ring.remove();
    ring
      .animate(
        [
          { transform: `${at} scale(0.2)`, opacity: 0.9 },
          { transform: `${at} scale(1)`, opacity: 0 },
        ],
        { duration: 650, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'forwards' }
      )
      .finished.then(remove, remove);
  }

  // Dark: black hole -----------------------------------------------------------

  private startHole(): void {
    if (this.hole) return;

    const canvas = this.canvas().nativeElement;
    this.hole = createBlackHole(canvas, {
      ...HOLE_LAYOUT,
      motion: this.reducedMotion ? 'still' : 'full',
    });
    if (!this.hole) return;

    canvas.hidden = false;
    // Zeroing the calibrated area makes onResize() request the first calibration.
    this.calibratedArea = 0;
    this.onResize();

    // Fade in over the CSS stars, then drop them: once the canvas is opaque
    // they would only be composited underneath it for nothing.
    requestAnimationFrame(() => canvas.classList.add('is-live'));
    this.liveTimer = setTimeout(() => document.body.classList.add('has-canvas'), 700);

    if (this.reducedMotion) this.hole.frame(0);
    else this.schedule();
  }

  private stopHole(): void {
    clearTimeout(this.liveTimer);
    clearTimeout(this.calibrateTimer);
    this.settleFrames = 0;
    document.body.classList.remove('has-canvas');
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }
    this.hole?.dispose();
    this.hole = null;

    const canvas = this.canvas().nativeElement;
    canvas.hidden = true;
    canvas.classList.remove('is-live');
  }

  private schedule(): void {
    this.frameId = requestAnimationFrame(t => this.tick(t));
  }

  private tick(t: number): void {
    this.frameId = 0;
    if (!this.hole) return;

    // Until the pointer has been seen the renderer keeps it parked on the hole.
    if (this.pointer.x >= 0) {
      this.hole.setPointer(this.pointer.x, this.pointer.y, this.pointer.inside);
    }
    this.hole.frame(t);
    if (this.settleFrames > 0 && --this.settleFrames === 0) this.calibrate();

    if (!document.hidden) this.schedule();
  }

  private onResize(): void {
    this.revealHalf = 0;
    if (!this.hole) return;

    this.hole.resize(window.innerWidth, window.innerHeight, this.dpr());
    if (this.reducedMotion) this.hole.frame(0);
    // Shrinking never needs a re-measure, and measuring on every event of a
    // drag would stall the GPU throughout it.
    if (window.innerWidth * window.innerHeight > this.calibratedArea * 1.5) {
      this.requestCalibration();
    }
  }

  private requestCalibration(): void {
    if (this.reducedMotion) {
      // No frame loop to count on; a still backdrop measures on a timer.
      clearTimeout(this.calibrateTimer);
      this.calibrateTimer = setTimeout(() => this.calibrate(), 1000);
    } else {
      this.settleFrames = SETTLE_FRAMES;
    }
  }

  /**
   * Sizes the drawing buffer to what the GPU can actually afford by timing
   * real frames, rather than watching requestAnimationFrame: rAF intervals
   * also stretch on 30 Hz displays and in throttled tabs, where cutting the
   * resolution would only make things blurrier. The lower of two samples is
   * used, since anything else sharing the GPU can only make a sample slower.
   */
  private calibrate(): void {
    if (!this.hole) return;
    this.calibratedArea = window.innerWidth * window.innerHeight;

    const sample = () => Math.min(this.hole!.measure(), this.hole!.measure());
    let ms = sample();
    while (ms > FRAME_BUDGET_MS && this.quality > 0.45) {
      this.quality *= 0.75;
      this.hole.resize(window.innerWidth, window.innerHeight, this.dpr());
      ms = sample();
    }
  }

  private dpr(): number {
    return Math.min(window.devicePixelRatio || 1, MAX_DPR) * this.quality;
  }

  private onVisibility(): void {
    if (document.hidden) {
      if (this.frameId) {
        cancelAnimationFrame(this.frameId);
        this.frameId = 0;
      }
    } else if (this.hole && !this.reducedMotion && !this.frameId) {
      this.schedule();
    }
  }
}
