import { Routes } from '@angular/router';

import {
  caseStudyExists,
  caseStudySeo,
} from './features/portfolio/case-studies/case-study.routes';
import { hasPosts, postExists, postSeo } from './features/writing/writing.routes';

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
        title: 'Backend Engineer',
        description:
          'Backend engineer in New Delhi building financial infrastructure and real-time ' +
          'systems in Go and TypeScript on GCP — and the Angular front ends, design ' +
          'systems and UX on top of them.',
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
          'Background, technical skills and education — backend and distributed systems ' +
          'in Go and TypeScript, plus front-end engineering and UI/UX.',
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
          'Five years across fintech and real-time systems: SMC Finance, Fliptoe, iTech ' +
          'Mission and Almondz Global Securities — what I built at each, back end and front.',
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
    // Both writing routes exist only while a post is visible in this build, so a
    // site with nothing published has no empty Writing page — it 404s instead.
    path: 'writing',
    canMatch: [hasPosts],
    loadComponent: () =>
      import('./features/writing/writing-list.component').then(m => m.WritingListComponent),
    data: {
      animation: 'writing',
      seo: {
        title: 'Writing',
        description:
          'Notes on backend design — encryption, scheduling and delivery guarantees, ' +
          'with the trade-offs behind each choice.',
      },
    },
  },
  {
    path: 'writing/:slug',
    canMatch: [postExists],
    loadComponent: () =>
      import('./features/writing/post.component').then(m => m.PostComponent),
    resolve: { seo: postSeo },
    data: { animation: 'post' },
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
          'Get in touch about senior backend engineering roles. Based in New Delhi, ' +
          'open to remote.',
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
