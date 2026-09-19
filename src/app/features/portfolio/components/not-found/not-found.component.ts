import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="px-6 py-24 min-h-[60vh] flex items-center justify-center">
      <div class="max-w-lg text-center">
        <p class="text-8xl font-black text-tertiary/30 dark:text-tertiary/40 leading-none">
          404
        </p>
        <h1 class="mt-4 text-4xl font-black dark:text-white">This page went missing</h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          The link may be out of date, or the address slightly off. Everything on the
          site is reachable from the navigation below.
        </p>
        <div class="mt-8 flex flex-wrap gap-3 justify-center">
          <a
            routerLink="/"
            class="bg-primary text-on-primary px-6 py-3 rounded-2xl font-bold shadow-elevation-1 hover:shadow-elevation-3 hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[20px]" aria-hidden="true"
              >arrow_forward</span
            >
            Back home
          </a>
          <a
            routerLink="/projects"
            class="bg-surface-elevated border border-outline/20 dark:border-white/10 text-gray-900 dark:text-white px-6 py-3 rounded-2xl font-bold hover:shadow-elevation-1 transition-all inline-flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[20px]" aria-hidden="true"
              >layers</span
            >
            See the work
          </a>
        </div>
      </div>
    </section>
  `,
})
export class NotFoundComponent {}
