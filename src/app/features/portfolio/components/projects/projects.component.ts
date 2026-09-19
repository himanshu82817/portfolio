import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, isDevMode } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE } from '../../../../core/site.config';
import { CaseStudy } from '../../case-studies/case-study.model';
import { visibleCaseStudies } from '../../case-studies/registry';

interface Project {
  title: string;
  category: string;
  subCategory: string;
  year: string;
  description: string;
  /** Headline outcomes. Kept short — these are what a reader actually scans. */
  highlights: string[];
  tech: string[];
  imageUrl: string;
  imageAlt: string;
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

  /** The first few technologies across all stack groups, for the card. */
  stackPreview(study: CaseStudy): string[] {
    return study.stack.flatMap(group => group.items).slice(0, 6);
  }

  readonly projects: readonly Project[] = [
    {
      title: 'Loan Origination System',
      category: 'Fintech',
      subCategory: 'Enterprise',
      year: '2023 – present',
      description:
        'A production loan origination platform used daily by credit and operations ' +
        'teams to move applications from submission through underwriting to disbursal.',
      highlights: [
        'Cut page load time by restructuring heavy Angular reactive forms',
        'Reduced API traffic with response caching and tighter state management',
        'Automated workflow validations that credit analysts previously ran by hand',
      ],
      tech: ['Angular', 'TypeScript', 'RxJS', 'SQL', 'REST'],
      imageUrl: '/projects/loan-origination.svg',
      imageAlt: 'Abstract illustration of a multi-stage loan approval pipeline',
      accessNote: 'Internal system — not publicly accessible',
    },
    {
      title: 'Learning Management System',
      category: 'EdTech',
      subCategory: 'Web App',
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
      imageUrl: '/projects/learning-management.svg',
      imageAlt: 'Abstract illustration of course cards with completion progress',
      accessNote: 'Internal system — not publicly accessible',
    },
    {
      title: 'This Portfolio',
      category: 'Personal',
      subCategory: 'Open Source',
      year: '2026',
      description:
        'The site you are reading. A statically built Angular application with ' +
        'class-based theming, lazy-loaded routes and a CI pipeline that deploys to a ' +
        'GCP VM on every push to master.',
      highlights: [
        'Design tokens defined once as CSS custom properties, consumed by Tailwind and TypeScript',
        'Theme applied before first paint, so dark-mode visitors never see a flash',
        'Every route lazy-loaded behind its own chunk',
      ],
      tech: ['Angular 19', 'Tailwind CSS', 'TypeScript', 'GitHub Actions', 'GCP'],
      imageUrl: '/projects/portfolio.svg',
      imageAlt: 'Abstract illustration of this portfolio: a dot grid with the H monogram',
      repoUrl: 'https://github.com/himanshu82817/portfolio',
    },
  ];
}
