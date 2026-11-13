import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE } from '../../../../core/site.config';

interface Highlight {
  /** Two or three words naming the thing — what a reader scanning the page lands on. */
  lead: string;
  detail: string;
}

interface Job {
  role: string;
  company: string;
  period: string;
  /** Employment type and place, e.g. "Full-time · Delhi". */
  terms: string;
  current?: boolean;
  /** One sentence: what the job was. Read before any of the highlights. */
  summary: string;
  highlights: Highlight[];
  tags: string[];
  /** Case studies that go deeper into this role's work. */
  caseStudies?: { label: string; slug: string }[];
}

/**
 * The page is a plain list, newest first. It used to be a zig-zag timeline with
 * a rail that lit up on scroll; that made the eye jump from side to side and
 * animated something on a page that is only there to be read. Each role is now
 * one card with the same shape: when and where on the left, what and how on the
 * right, and every highlight led by the thing it is about.
 */
@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './experience.component.html',
})
export class ExperienceComponent {
  readonly site = SITE;

  readonly experiences: readonly Job[] = [
    {
      role: 'Software Developer',
      company: 'SMC Finance',
      period: 'Oct 2023 – Present',
      terms: 'Full-time · Delhi',
      current: true,
      summary:
        'I design and build the systems behind loan origination and credit decisioning, ' +
        'and the Angular client the credit teams work in every day.',
      highlights: [
        {
          lead: 'Workflow engine',
          detail:
            'A configuration-driven engine for a multi-stage loan pipeline that processes ' +
            'thousands of applications a month. Business teams change stage flows and ' +
            'validation rules without a release.',
        },
        {
          lead: 'Underwriting engine',
          detail:
            'Concurrent state transitions across multi-stage approvals, each in an isolated ' +
            'transaction on SQL Server.',
        },
        {
          lead: 'Event-driven services',
          detail:
            'NestJS and GCP Pub/Sub workers that automate collateral initiation, replacing ' +
            'manual credit-verification steps.',
        },
        {
          lead: 'API design',
          detail:
            'The REST layer for the pipeline, with a weighted round-robin distributor that ' +
            'allocates valuation tasks across external agencies.',
        },
        {
          lead: 'Front end',
          detail:
            'Cut client network I/O 60% with an RxJS caching tier and First Contentful Paint ' +
            '40% on the loan system’s Angular client, with 90% Jest coverage on critical modules.',
        },
      ],
      tags: ['NestJS', 'TypeScript', 'SQL Server', 'TypeORM', 'GCP Pub/Sub', 'Angular', 'RxJS'],
    },
    {
      role: 'Freelance Backend Engineer',
      company: 'Fliptoe',
      period: 'Sep 2025 – Present',
      terms: 'Freelance, part-time · Remote',
      current: true,
      summary:
        'Sole backend engineer for a live social video app: architecture, API design, the ' +
        'real-time presence layer and data modelling, end to end.',
      highlights: [
        {
          lead: 'Streaming server',
          detail:
            'Live video in Go — RTMP ingest, FFmpeg transcoding, HLS delivery — with one ' +
            'goroutine per stream and channel-based fan-out.',
        },
        {
          lead: 'WebRTC signalling',
          detail:
            'Call-state management in Go for multi-party sessions, handling reconnection and ' +
            'graceful degradation under network loss.',
        },
        {
          lead: 'AR face filters',
          detail:
            'An on-device ML pipeline in native C++ with MediaPipe face tracking, bridged to ' +
            'React Native.',
        },
      ],
      tags: ['Go', 'WebRTC', 'WebSockets', 'FFmpeg', 'MongoDB', 'C++', 'React Native'],
      caseStudies: [
        { label: 'Fliptoe platform', slug: 'fliptoe' },
        { label: 'FliptoeFace', slug: 'fliptoeface' },
      ],
    },
    {
      role: 'Solution Developer',
      company: 'iTech Mission Pvt. Ltd.',
      period: 'Sep 2022 – Aug 2023',
      terms: 'Full-time · Delhi',
      summary: 'Real-time dashboards, and the front-end architecture underneath them.',
      highlights: [
        {
          lead: 'Real-time analytics',
          detail:
            'A WebSocket pipeline streaming 10,000+ live data points with sub-second updates, ' +
            'without blocking the browser’s main thread.',
        },
        {
          lead: 'UI architecture',
          detail:
            'Led the migration of tightly coupled legacy UI codebases to a decoupled component ' +
            'architecture.',
        },
      ],
      tags: ['WebSockets', 'TypeScript', 'Angular', 'Data visualisation'],
    },
    {
      role: 'Full Stack Developer',
      company: 'Almondz Global Securities Ltd.',
      period: 'Jun 2021 – Sep 2022',
      terms: 'Full-time · Delhi',
      summary: 'Internal platforms for financial teams, built end to end.',
      highlights: [
        {
          lead: 'Learning platform',
          detail:
            'A Learning Management System from the ground up, with strict role-based access ' +
            'control and data isolation between teams.',
        },
        {
          lead: 'Reporting',
          detail:
            'Optimised complex SQL queries and schema design for reports over large ' +
            'operational datasets.',
        },
        {
          lead: 'Component library',
          detail: 'Reusable components that standardised the UI across three internal applications.',
        },
      ],
      tags: ['Node.js', 'SQL', 'RBAC', 'Angular'],
    },
  ];
}
