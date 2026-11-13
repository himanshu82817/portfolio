import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, isDevMode } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE } from '../../../../core/site.config';
import { CaseStudy } from '../../case-studies/case-study.model';
import { visibleCaseStudies } from '../../case-studies/registry';

interface Project {
  title: string;
  /** One or two words for what kind of system it is, e.g. "Fintech · Enterprise". */
  category: string;
  year: string;
  description: string;
  /** Headline outcomes. Kept short — these are what a reader actually scans. */
  highlights: string[];
  tech: string[];
  liveUrl?: string;
  repoUrl?: string;
  /** Set for employer systems that cannot be linked or screenshotted. */
  accessNote?: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [NgClass, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects.component.html',
})
export class ProjectsComponent {
  readonly site = SITE;
  readonly isDev = isDevMode();

  /** Published case studies, plus drafts in development builds. */
  readonly caseStudies = visibleCaseStudies();

  readonly statusClass: Record<CaseStudy['status']['tone'], string> = {
    live: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
    beta: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
    building: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
    internal: 'bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-gray-300',
  };

  /**
   * A few technologies for the card, taken two at a time from each stack group in
   * turn. Taking the first six outright showed only the first group — LifeBoard's
   * card listed six front-end tools and nothing of its API or cloud.
   */
  stackPreview(study: CaseStudy, limit = 7): string[] {
    const picked: string[] = [];
    for (let start = 0; picked.length < limit; start += 2) {
      const round = study.stack.flatMap(group => group.items.slice(start, start + 2));
      if (!round.length) break;
      picked.push(...round);
    }
    return picked.slice(0, limit);
  }

  readonly projects: readonly Project[] = [
    {
      title: 'Loan Origination System',
      category: 'Fintech · Enterprise',
      year: '2023 – present',
      description:
        'A production loan origination platform that moves thousands of applications a ' +
        'month from submission through underwriting to disbursal.',
      highlights: [
        'Configuration-driven workflow engine: stage flows and validation rules change without a release',
        'Underwriting decisioning engine with isolated transactions for concurrent approvals',
        'Event-driven collateral workflows on GCP Pub/Sub, replacing manual verification steps',
      ],
      tech: ['NestJS', 'TypeScript', 'SQL Server', 'TypeORM', 'GCP Pub/Sub'],
      accessNote: 'Internal system',
    },
    {
      title: 'Learning Management System',
      category: 'EdTech · Internal platform',
      year: '2022',
      description:
        'An internal training platform covering course management, student progress ' +
        'tracking and assessments, built for employee upskilling.',
      highlights: [
        'Built reusable Angular component library that sped up feature delivery',
        'Implemented role-based access control across learners, trainers and admins',
        'Integrated REST APIs and optimised reporting queries against SQL',
      ],
      tech: ['Angular', 'Node.js', 'SQL', 'REST', 'RBAC'],
      accessNote: 'Internal system',
    },
    {
      title: 'This Portfolio',
      category: 'Personal · Open source',
      year: '2026',
      description:
        'The site you are reading. A statically built Angular application, designed to ' +
        'be read: a still backdrop, one type scale, and case studies and posts kept as ' +
        'typed data.',
      highlights: [
        'Design tokens defined once as CSS custom properties, consumed by Tailwind and TypeScript',
        'Theme applied before first paint, so dark-mode visitors never see a flash',
        'Drafts are left out of production at build time, and a script fails any build that contains one',
      ],
      tech: ['Angular 19', 'Tailwind CSS', 'TypeScript', 'GitHub Actions', 'GCP'],
      repoUrl: 'https://github.com/himanshu82817/portfolio',
    },
  ];
}
