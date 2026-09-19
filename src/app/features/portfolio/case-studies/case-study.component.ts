import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  isDevMode,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ArchitectureDiagramComponent } from './architecture-diagram.component';
import { CaseStudy, Metric, OWNERSHIP_LABEL, Ownership } from './case-study.model';
import { findCaseStudy, nextCaseStudy } from './registry';

@Component({
  selector: 'app-case-study',
  standalone: true,
  imports: [NgClass, RouterLink, ArchitectureDiagramComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-study.component.html',
})
export class CaseStudyComponent {
  /** Bound from the :slug route parameter by withComponentInputBinding(). */
  readonly slug = input.required<string>();

  readonly isDev = isDevMode();
  readonly study = computed(() => findCaseStudy(this.slug()));
  readonly next = computed(() => nextCaseStudy(this.slug()));

  /** "On this page" links — a section with no content gets no link. */
  readonly toc = computed(() => {
    const study = this.study();
    if (!study) return [];
    return [
      { id: 'overview', label: 'Overview', show: true },
      { id: 'architecture', label: 'Architecture', show: true },
      { id: 'decisions', label: 'Decisions', show: study.decisions.length > 0 },
      { id: 'features', label: 'Features', show: study.features.length > 0 },
      { id: 'challenges', label: 'Hard problems', show: study.challenges.length > 0 },
      { id: 'stack', label: 'Stack', show: study.stack.length > 0 },
      { id: 'gallery', label: 'Screens', show: study.gallery.length > 0 },
    ].filter(item => item.show);
  });

  readonly ownershipLabel = OWNERSHIP_LABEL;

  readonly ownershipClass: Record<Ownership, string> = {
    built: 'bg-primary/20 text-green-900 dark:text-primary',
    owner: 'bg-primary/15 text-green-900 dark:text-primary',
    extended: 'bg-tertiary-container text-on-tertiary-container',
    contributed: 'bg-surface-variant text-gray-700 dark:text-gray-300',
  };

  readonly statusClass: Record<CaseStudy['status']['tone'], string> = {
    live: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
    beta: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
    building: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
    internal: 'bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-gray-300',
  };

  readonly engagementLabel: Record<CaseStudy['engagement'], string> = {
    personal: 'Personal product',
    contract: 'Contract',
    employer: 'Employer',
  };

  /** A design target is labelled as one, so it's never mistaken for a result. */
  readonly metricKindLabel: Record<Metric['kind'], string> = {
    measured: 'Measured',
    target: 'Design target',
    count: '',
  };

  pad(index: number): string {
    return String(index + 1).padStart(2, '0');
  }
}
