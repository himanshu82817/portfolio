import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';
import { SITE } from '../site.config';

export interface RouteSeo {
  /** Page title, without the site suffix. */
  title: string;
  description: string;
}

/**
 * Keeps <title>, the meta description, the canonical link and the Open Graph
 * tags in step with the active route.
 *
 * Note this only helps crawlers that execute JavaScript. The static tags in
 * index.html are what most social scrapers read; enable prerendering if you need
 * per-route previews (see README).
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  init(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => this.route),
        map(route => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap(route => route.data)
      )
      .subscribe(data => this.apply(data['seo'] as RouteSeo | undefined));
  }

  private apply(seo: RouteSeo | undefined): void {
    const pageTitle = seo?.title
      ? `${seo.title} — ${SITE.name}`
      : `${SITE.name} — ${SITE.role}`;
    const description = seo?.description ?? SITE.description;
    const url = this.canonicalUrl();

    this.title.setTitle(pageTitle);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    this.setCanonical(url);
  }

  /**
   * Built from the live origin rather than SITE.siteUrl so it stays correct on
   * localhost, on preview hosts, and if the domain ever changes.
   */
  private canonicalUrl(): string {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : SITE.siteUrl;
    const path = this.router.url.split('?')[0].split('#')[0];
    return path === '/' ? origin + '/' : origin + path;
  }

  private setCanonical(url: string): void {
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
  }
}
