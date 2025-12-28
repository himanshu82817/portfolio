
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, AfterViewInit, ViewChildren, QueryList } from '@angular/core';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.component.html'
})
export class ExperienceComponent implements AfterViewInit {
  @ViewChild('timeline') timeline: ElementRef | undefined;

  experiences = [
    {
      role: 'Full Stack Developer',
      company: 'Tech Solutions Inc.',
      period: 'Jan 2022 - Present',
      description: [
        'Developed and maintained web applications using Angular, Node.js, and MongoDB.',
        'Collaborated with cross-functional teams to deliver high-quality software.',
        'Implemented responsive designs with Tailwind CSS.'
      ],
      tags: ['Angular', 'Node.js', 'MongoDB', 'Tailwind CSS'],
      dotColor: 'bg-primary'
    },
    {
      role: 'Frontend Developer',
      company: 'Creative Minds',
      period: 'Jun 2020 - Dec 2021',
      description: [
        'Built and optimized user interfaces for various clients.',
        'Worked with React and Vue.js to create engaging user experiences.',
        'Ensured cross-browser compatibility and performance.'
      ],
      tags: ['React', 'Vue.js', 'SCSS'],
       dotColor: 'bg-tertiary'
    },
    {
      role: 'Junior Web Developer',
      company: 'Digital Dreams',
      period: 'May 2019 - May 2020',
      description: [
        'Assisted in the development of WordPress websites.',
        'Learned the fundamentals of web development and best practices.',
        'Provided support and maintenance for existing sites.'
      ],
      tags: ['HTML', 'CSS', 'JavaScript', 'WordPress'],
      dotColor: 'bg-surface-variant'
    }
  ];

  ngAfterViewInit() {
    // Defer the initial call to ensure all elements are rendered
    setTimeout(() => this.updateGlareEffect(), 0);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.updateGlareEffect();
  }

  // Helper to convert hex color format to rgba
  private hexToRgba(hex: string, alpha: number = 1): string {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
    }
    return hex; // Fallback if format is not hex
  }

  private updateGlareEffect() {
    const style = getComputedStyle(document.documentElement);
    const isDarkMode = document.documentElement.classList.contains('dark');
    const viewportCenter = window.innerHeight / 2;

    // 1. Update Timeline Gradient
    if (this.timeline) {
      const timelineEl = this.timeline.nativeElement;
      const timelineRect = timelineEl.getBoundingClientRect();
      const centerRelativeToTimeline = viewportCenter - timelineRect.top;
      const percentage = (centerRelativeToTimeline / timelineRect.height) * 100;
      
      const brightColor = style.getPropertyValue('--primary').trim() || '#FF4081';
      const dullColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

      timelineEl.style.background = `linear-gradient(to bottom, ${dullColor}, ${dullColor} ${percentage - 10}%, ${brightColor} ${percentage}%, ${dullColor} ${percentage + 10}%, ${dullColor})`;
    }
  }
}
