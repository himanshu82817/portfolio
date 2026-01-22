import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Project {
  title: string;
  category: string;
  subCategory: string; // e.g., "Mobile", "SaaS"
  year: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './projects.component.html',
  styles: []
})
export class ProjectsComponent {
  projects: Project[] = [
    {
      title: 'Loan Origination System',
      category: 'Fintech',
      subCategory: 'Enterprise',
      year: '2023',
      description: 'Built multiple modules for a production-grade loan origination system used by credit and operations teams. Improved UI performance by optimizing Angular reactive forms, reducing page load time significantly. Reduced API calls by implementing response caching and better state management. Increased credit team efficiency by automating workflows and validations.',
      // Ensure these images exist in your assets folder or use placeholders
      imageUrl: 'assets/images/project1.jpg', 
      imageAlt: 'Loan Origination System dashboard'
    },
    {
      title: 'Learning Management System',
      category: 'EdTech',
      subCategory: 'Web App',
      year: '2022',
      description: 'Developed modules for course management, student tracking, and assessments. Built reusable Angular components to improve development speed and consistency. Integrated REST APIs and handled role-based access control.',
      imageUrl: 'assets/images/project2.jpg',
      imageAlt: 'Learning Management System dashboard'
    }
  ];
}