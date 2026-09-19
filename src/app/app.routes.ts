import { Routes } from '@angular/router';

import {
  caseStudyExists,
  caseStudySeo,
} from './features/portfolio/case-studies/case-study.routes';

/**
 * Every route is lazy-loaded. The landing route is the only component most
 * visitors ever see, so the rest should not be in the initial bundle.
 *
 * `data.seo` drives the document title and meta description — see SeoService.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/portfolio/components/hero/hero.component').then(
        m => m.HeroComponent
      ),
    data: {
      animation: 'home',
      seo: {
        title: 'Full Stack Engineer',
        description:
          'Full Stack Engineer in New Delhi building Angular front-ends and Node/SQL ' +
          'services for fintech and edtech — loan origination, learning platforms, and ' +
          'the reporting systems behind them.',
      },
    },
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./features/portfolio/components/about/about.component').then(
        m => m.AboutComponent
      ),
    data: {
      animation: 'about',
      seo: {
        title: 'About',
        description:
          'Background, technical skills and education — Angular, TypeScript, Node.js, ' +
          'NestJS, SQL and system design.',
      },
    },
  },
  {
    path: 'experience',
    loadComponent: () =>
      import('./features/portfolio/components/experience/experience.component').then(
        m => m.ExperienceComponent
      ),
    data: {
      animation: 'experience',
      seo: {
        title: 'Experience',
        description:
          'Software engineering roles at SMC Finance, iTech Mission and Almondz Global ' +
          'Securities — loan origination, BI dashboards and learning management systems.',
      },
    },
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./features/portfolio/components/projects/projects.component').then(
        m => m.ProjectsComponent
      ),
    data: {
      animation: 'projects',
      seo: {
        title: 'Projects',
        description:
          'Case studies and selected work — the architecture, decisions and hard problems ' +
          'behind the systems I design and own.',
      },
    },
  },
  {
    // canMatch rejects unknown or unpublished slugs, so they fall through to the
    // 404 route below instead of rendering an empty page.
    path: 'projects/:slug',
    canMatch: [caseStudyExists],
    loadComponent: () =>
      import('./features/portfolio/case-studies/case-study.component').then(
        m => m.CaseStudyComponent
      ),
    resolve: { seo: caseStudySeo },
    data: { animation: 'case-study' },
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/portfolio/components/contact/contact.component').then(
        m => m.ContactComponent
      ),
    data: {
      animation: 'contact',
      seo: {
        title: 'Contact',
        description:
          'Get in touch about full stack engineering roles and freelance work. ' +
          'Based in New Delhi, open to remote and hybrid.',
      },
    },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/portfolio/components/not-found/not-found.component').then(
        m => m.NotFoundComponent
      ),
    data: {
      animation: 'not-found',
      seo: { title: 'Page not found', description: 'That page does not exist.' },
    },
  },
];
