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
      title: 'DataViz Pro',
      category: 'SaaS',
      subCategory: 'Analytics',
      year: '2024',
      description: 'A comprehensive data visualization platform allowing users to import CSVs and generate real-time interactive charts.',
      // Ensure these images exist in your assets folder or use placeholders
      imageUrl: 'assets/images/project1.jpg', 
      imageAlt: 'Dashboard interface screenshot showing data analytics charts'
    },
    {
      title: 'ShopEasy App',
      category: 'E-Commerce',
      subCategory: 'Mobile',
      year: '2023',
      description: 'A React Native mobile application for a seamless shopping experience with Stripe payment integration.',
      imageUrl: 'assets/images/project2.jpg',
      imageAlt: 'Mobile application mockup for e-commerce store'
    },
    {
      title: 'NeuroChat',
      category: 'AI',
      subCategory: 'Chatbot',
      year: '2023',
      description: 'An intelligent customer support chatbot powered by OpenAI API, reducing human workload by 70%.',
      imageUrl: 'assets/images/project3.jpg',
      imageAlt: 'Abstract gradient background representing AI interface'
    }
  ];
}