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
    'JavaScript', 'TypeScript', 'React', 'Next.js',
    'PostgreSQL', 'Node.js', 'AWS', 'Tailwind'
  ];
}