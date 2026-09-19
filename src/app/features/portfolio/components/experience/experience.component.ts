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
        'Work on a Loan Origination System used daily by credit and operations teams.',
        'Built and enhanced multiple frontend modules in Angular.',
        'Cut page load time by optimising Angular reactive forms.',
        'Reduced API calls through response caching and tighter state management.',
      ],
      tags: ['Angular', 'TypeScript', 'Performance', 'Caching', 'SQL'],
    },
    {
      role: 'Solution Developer',
      company: 'iTech Mission Pvt. Ltd.',
      period: 'Sep 2022 – Aug 2023',
      description: [
        'Built interactive data visualisation and chart dashboards for internal and external stakeholders.',
        'Integrated business intelligence modules with backend services for real-time insight.',
        'Developed web application features using Angular and REST APIs.',
        'Worked with cross-functional teams to refine requirements and ship UI improvements.',
      ],
      tags: ['Angular', 'React', 'Data Visualization', 'TypeScript', 'MongoDB'],
    },
    {
      role: 'Full Stack Developer',
      company: 'Almondz Global Securities Ltd.',
      period: 'Dec 2021 – Sep 2022',
      description: [
        'Developed the Learning Management System used for internal training and upskilling.',
        'Worked on internal financial and operations management systems.',
        'Built frontend features in Angular and backend services in Node.js.',
        'Integrated SQL databases and optimised complex reporting queries.',
      ],
      tags: ['Angular', 'Node.js', 'SQL', 'JavaScript', 'MongoDB'],
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
