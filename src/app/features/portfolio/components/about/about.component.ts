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
    { name: 'Languages', skills: ['TypeScript', 'JavaScript', 'C++', 'SQL'] },
    {
      name: 'Frontend',
      skills: [
        'Angular',
        'React',
        'React Native',
        'Tailwind CSS',
        'Angular Material',
        'PrimeNG',
        'Material UI',
      ],
    },
    {
      name: 'Backend & data',
      skills: ['Node.js', 'NestJS', 'REST APIs', 'MySQL', 'PostgreSQL', 'MongoDB'],
    },
    { name: 'Cloud & tooling', skills: ['Google Cloud Platform', 'Docker', 'Git'] },
    {
      name: 'Foundations',
      skills: [
        'Data Structures & Algorithms',
        'System Design (HLD & LLD)',
        'OOP & Design Patterns',
        'Operating Systems',
        'DBMS',
        'Computer Networks',
      ],
    },
  ];

  readonly expertise = [
    { title: 'System Design', icon: 'architecture' },
    { title: 'Data Structures & Algorithms', icon: 'code' },
    { title: 'Software Development', icon: 'folder_code' },
  ];
}
