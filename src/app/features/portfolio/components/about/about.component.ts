import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE } from '../../../../core/site.config';

interface SkillGroup {
  name: string;
  skills: string[];
}

@Component({
  selector: 'app-about',
  standalone: true,
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
    { name: 'Frontend', skills: ['Angular', 'RxJS', 'NgRx', 'React Native'] },
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
    { title: 'System Design', icon: 'architecture' },
    { title: 'Data Structures & Algorithms', icon: 'code' },
    { title: 'Distributed Systems', icon: 'folder_code' },
  ];
}
