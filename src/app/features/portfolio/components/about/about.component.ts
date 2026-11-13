import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE } from '../../../../core/site.config';

interface SkillGroup {
  name: string;
  skills: string[];
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about.component.html',
})
export class AboutComponent {
  readonly site = SITE;

  /**
   * Grouped rather than one 28-item blob — a recruiter scanning for "does he do
   * backend" can find the answer without reading every chip. Deliberately omits
   * things that are assumed at this level (HTML, CSS) or that are not skills
   * (VS Code).
   */
  readonly skillGroups: readonly SkillGroup[] = [
    { name: 'Languages', skills: ['Go', 'TypeScript', 'JavaScript', 'C++', 'SQL'] },
    {
      name: 'Backend',
      skills: [
        'NestJS',
        'Node.js',
        'REST APIs',
        'WebSockets',
        'WebRTC',
        'Microservices',
        'Event-driven architecture',
      ],
    },
    {
      name: 'Frontend & UI',
      skills: [
        'Angular',
        'Signals',
        'RxJS',
        'NgRx',
        'Tailwind CSS',
        'React Native',
        'Design systems',
        'Accessibility',
        'PWA & offline-first',
      ],
    },
    {
      name: 'Data',
      skills: ['PostgreSQL', 'SQL Server', 'MongoDB', 'Redis', 'TypeORM'],
    },
    {
      name: 'Streaming & media',
      skills: ['RTMP', 'HLS', 'FFmpeg', 'MediaPipe'],
    },
    {
      name: 'Cloud & tooling',
      skills: [
        'Google Cloud Run',
        'Pub/Sub',
        'Cloud KMS',
        'Cloud Storage',
        'Docker',
        'GitHub Actions',
      ],
    },
    {
      name: 'Foundations',
      skills: [
        'Data Structures & Algorithms',
        'System Design (HLD & LLD)',
        'OOP & Design Patterns',
        'Distributed Systems',
        'Concurrency',
      ],
    },
  ];

  readonly expertise = [
    {
      title: 'Backend & distributed systems',
      detail: 'Workflow engines, event-driven services, concurrency.',
      icon: 'dns',
    },
    {
      title: 'Frontend & UI/UX',
      detail: 'Angular, design systems, accessible and offline-first interfaces.',
      icon: 'palette',
    },
    {
      title: 'System design',
      detail: 'Trade-offs written down: what was chosen, and what it cost.',
      icon: 'architecture',
    },
    {
      title: 'Algorithms',
      detail: 'LeetCode Knight, top 2.71% in contest rating.',
      icon: 'code',
    },
  ];
}
