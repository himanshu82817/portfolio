import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './hero.component.html',
  styles: []
})
export class HeroComponent {
  // You can easily update stats here without touching the HTML
  stats = [
    { label: 'Years Exp.', value: '5+', icon: 'code_blocks', colorClass: 'text-tertiary', bgClass: 'bg-tertiary/10' },
    { label: 'Projects', value: '30+', icon: 'rocket_launch', colorClass: 'text-yellow-700', bgClass: 'bg-primary/20' }
  ];

  scrollTo(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}