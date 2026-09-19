import { Component, inject } from '@angular/core';
import { ChildrenOutletContexts, RouterOutlet } from '@angular/router';
import { animate, query, style, transition, trigger } from '@angular/animations';

import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { BackdropComponent } from './shared/backdrop/backdrop.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, BackdropComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        query(
          ':enter',
          [style({ opacity: 0, transform: 'translateY(20px)' })],
          { optional: true }
        ),
        // The leaving view is taken out of flow only for the duration of the
        // transition, so the container keeps the entering view's height and the
        // page does not collapse mid-navigation.
        query(
          ':leave',
          [
            style({ position: 'absolute', inset: 0, opacity: 1 }),
            animate('150ms ease-in', style({ opacity: 0 })),
          ],
          { optional: true }
        ),
        query(
          ':enter',
          [animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))],
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class AppComponent {
  private readonly contexts = inject(ChildrenOutletContexts);

  /**
   * Angular animations run through the Web Animations API, so the global
   * prefers-reduced-motion rule in styles.css does not reach them. Returning a
   * constant keeps the trigger from ever seeing a state change.
   */
  private readonly prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  getRouteAnimationData(): unknown {
    if (this.prefersReducedMotion) return 'static';
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }

  /**
   * With <base href="/"> in index.html, a bare "#main-content" resolves to
   * "/#main-content" — so on any route other than home, following the link would
   * navigate to the home page instead of skipping to the content. Moving focus
   * directly keeps the link working everywhere; the href stays for semantics.
   */
  skipToMain(event: Event): void {
    event.preventDefault();
    document.getElementById('main-content')?.focus();
  }
}
