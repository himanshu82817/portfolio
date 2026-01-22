import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styles: []
})
export class AboutComponent {
  // Easily manage your skills here
  skills = [
    'JavaScript', 'TypeScript', 'C++', 'SQL',
    'Angular', 'React', 'React Native', 'HTML', 'CSS',
    'Node.js', 'NestJS', 'MySQL', 'PostgreSQL',
    'Git', 'VS Code', 'Docker', 'Google Cloud Platform',
    'Angular Material', 'PrimeNG', 'Material-UI',
    'Data Structures & Algorithms', 'Operating Systems', 'Database Management Systems', 'Computer Networks',
    'Low-Level Design (LLD)', 'High-Level Design (HLD)', 'OOP', 'Design Patterns'
  ];
}