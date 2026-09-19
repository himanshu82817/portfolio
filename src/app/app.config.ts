import { ViewportScroller } from '@angular/common';
import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { SeoService } from './core/services/seo.service';
import { ThemeService } from './core/services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
      // Hands route params to routed components as signal inputs. The case-study
      // page reads its :slug this way.
      withComponentInputBinding()
    ),
    // Async so the animations engine lands in its own chunk instead of the
    // initial bundle — it is not needed until the first route transition.
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideAppInitializer(() => {
      // Instantiating ThemeService installs the OS-preference listener; the
      // `dark` class itself was already applied by the inline script in index.html.
      inject(ThemeService);
      inject(SeoService).init();
      // Leaves some space above a section when jumping to it from an in-page link.
      inject(ViewportScroller).setOffset([0, 32]);
    }),
  ],
};
