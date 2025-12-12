import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BlogPost {
  category: string;
  readTime: string;
  title: string;
  description: string;
  // classes for the specific color themes (Frontend=Purple, Backend=Green, Design=Gray)
  categoryClass: string; 
  decorationClass: string;
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blog.component.html',
  styles: []
})
export class BlogComponent {
  posts: BlogPost[] = [
    {
      category: 'Frontend',
      readTime: '5 min read',
      title: 'Mastering React Hooks',
      description: 'A deep dive into useEffect, useContext, and custom hooks to write cleaner and more efficient React code.',
      // Purple/Tertiary Theme
      categoryClass: 'text-tertiary bg-tertiary/5 dark:bg-tertiary/20',
      decorationClass: 'bg-tertiary/10 dark:bg-tertiary/20'
    },
    {
      category: 'Backend',
      readTime: '8 min read',
      title: 'Scaling Node.js Apps',
      description: 'Strategies for handling high traffic loads, clustering, and memory management in production environments.',
      // Green/Primary Theme
      categoryClass: 'text-primary bg-primary/10 dark:text-primary dark:bg-primary/20',
      decorationClass: 'bg-primary/20'
    },
    {
      category: 'Design',
      readTime: '4 min read',
      title: 'Material You for Web',
      description: 'Implementing Google\'s Material Design 3 principles in web applications using Tailwind CSS and custom tokens.',
      // Gray Theme
      categoryClass: 'text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/10',
      decorationClass: 'bg-gray-100 dark:bg-white/5'
    }
  ];
}