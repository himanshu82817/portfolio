import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Experience {
  role: string;
  company: string;
  period: string;
  description: string[];
  tags: string[];
  dotColor: string; // Controls the color of the timeline dot
}

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.component.html',
  styles: []
})
export class ExperienceComponent {
  experiences: Experience[] = [
    {
      role: 'Senior Developer',
      company: 'Tech Giants Inc.',
      period: '2021 - Present',
      description: [
        'Led a team of 10 developers in migration to Microservices.',
        'Improved system performance by 40% using Redis caching.'
      ],
      tags: ['React', 'Node'],
      dotColor: 'bg-primary'
    },
    {
      role: 'Full Stack Engineer',
      company: 'Startup Hub',
      period: '2019 - 2021',
      description: [
        'Developed core payments infrastructure processing $1M+ monthly.',
        'Implemented CI/CD pipelines reducing deployment time by 60%.'
      ],
      tags: ['Express', 'MongoDB'],
      dotColor: 'bg-tertiary'
    },
    {
      role: 'Junior Developer',
      company: 'Web Solutions',
      period: '2018 - 2019',
      description: [
        'Built responsive UI components for client websites.',
        'Assisted in backend API integration and bug fixes.'
      ],
      tags: ['HTML/CSS', 'JS'],
      dotColor: 'bg-white' 
    }
  ];
}