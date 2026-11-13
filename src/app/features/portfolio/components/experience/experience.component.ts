import { NgClass } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  inject,
  viewChild,
} from '@angular/core';

interface Job {
  role: string;
  company: string;
  period: string;
  description: string[];
  tags: string[];
  current?: boolean;
}

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './experience.component.html',
})
export class ExperienceComponent implements AfterViewInit {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly timeline = viewChild<ElementRef<HTMLElement>>('timeline');

  readonly experiences: readonly Job[] = [
    {
      role: 'Software Developer',
      company: 'SMC Finance',
      period: 'Oct 2023 – Present',
      current: true,
      description: [
        'Designed and shipped a configuration-driven workflow engine for a multi-stage loan origination pipeline processing thousands of applications a month — business teams change stage flows and validation rules without a release.',
        'Engineered the core underwriting decisioning engine, managing concurrent state transitions across multi-stage approvals with isolated transactions on SQL Server.',
        'Built an event-driven microservice on NestJS and GCP Pub/Sub that automates collateral initiation, replacing manual credit-verification steps with asynchronous workers.',
        'Designed the REST API layer for the pipeline, including a weighted round-robin distributor that allocates valuation tasks across external agencies.',
        'Maintained 90% Jest coverage across critical financial modules; cut client-side network I/O 60% with an RxJS caching tier.',
      ],
      tags: ['NestJS', 'TypeScript', 'SQL Server', 'TypeORM', 'GCP Pub/Sub', 'Angular'],
    },
    {
      role: 'Freelance Backend Engineer',
      company: 'Fliptoe — live social video platform',
      period: 'Sep 2025 – Present · Part-time',
      current: true,
      description: [
        'Sole backend engineer: own the architecture, API design, real-time WebSocket presence layer and MongoDB data modelling end to end.',
        'Built a live video streaming server in Go (RTMP ingest, FFmpeg transcoding, HLS delivery) with goroutine-per-stream concurrency and channel-based fan-out.',
        'Implemented WebRTC signalling and call-state management in Go for multi-party sessions, handling reconnection and graceful degradation under network loss.',
        'Built an on-device ML inference pipeline for AR filters in native C++ with MediaPipe face tracking, bridged to React Native.',
      ],
      tags: ['Go', 'WebRTC', 'WebSockets', 'FFmpeg', 'MongoDB', 'C++'],
    },
    {
      role: 'Solution Developer',
      company: 'iTech Mission Pvt. Ltd.',
      period: 'Sep 2022 – Aug 2023',
      description: [
        'Built a real-time analytics pipeline over WebSockets streaming 10,000+ live data points with sub-second update latency.',
        'Led the migration of legacy UI codebases to a decoupled component architecture.',
      ],
      tags: ['WebSockets', 'TypeScript', 'Angular', 'Data Visualization'],
    },
    {
      role: 'Full Stack Developer',
      company: 'Almondz Global Securities Ltd.',
      period: 'Jun 2021 – Sep 2022',
      description: [
        'Engineered a secure Learning Management System from the ground up, with strict role-based access control and data isolation across internal financial teams.',
        'Optimised complex SQL queries and schema design for reporting over large operational datasets.',
      ],
      tags: ['Node.js', 'SQL', 'RBAC', 'Angular'],
    },
  ];

  ngAfterViewInit(): void {
    // The rail highlight is decorative and touches only inline styles, so it runs
    // entirely outside Angular — no change detection is triggered by scrolling.
    this.zone.runOutsideAngular(() => {
      let ticking = false;

      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          this.paintRailHighlight();
          ticking = false;
        });
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      });

      this.paintRailHighlight();
    });
  }

  /** Moves a bright band down the timeline rail as it passes the viewport centre. */
  private paintRailHighlight(): void {
    const el = this.timeline()?.nativeElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.height === 0) return;

    const progress = ((window.innerHeight / 2 - rect.top) / rect.height) * 100;
    const clamped = Math.max(0, Math.min(100, progress));

    // Reads the live theme token defined in styles.css. Previously this looked up
    // a variable that was never declared and silently fell back to hot pink.
    const channels = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary')
      .trim();
    const bright = channels ? `rgb(${channels})` : '#39e079';
    const dull = document.documentElement.classList.contains('dark')
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.10)';

    el.style.backgroundImage =
      `linear-gradient(to bottom, ${dull}, ${dull} ${clamped - 10}%, ` +
      `${bright} ${clamped}%, ${dull} ${clamped + 10}%, ${dull})`;
  }
}
