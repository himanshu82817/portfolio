
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
      role: 'Software Developer',
      company: 'SMC Finance',
      period: 'Oct 2023 - Present',
      description: [
        'Worked on a Loan Origination System used by credit and operations teams.',
        'Built and enhanced multiple frontend modules using Angular.',
        'Improved UI performance by optimizing Angular reactive forms, significantly reducing load time.',
        'Reduced API calls by implementing caching and efficient state management.'
      ],
      tags: ['Angular', 'TypeScript', 'Performance Optimization', 'Caching', 'SQL'],
      dotColor: 'bg-primary'
    },
    {
      role: 'Solution Developer',
      company: 'iTech Mission Pvt. Ltd.',
      period: 'Sep 2022 - Aug 2023',
      description: [
        'Built interactive data visualization and chart dashboards for internal and external stakeholders.',
        'Integrated business intelligence modules with backend services to display real-time insights.',
        'Worked on web application features using Angular and REST APIs.',
        'Collaborated with cross-functional teams to refine requirements and implement UI enhancements.'
      ],
      tags: ['Angular', 'Data Visualization', 'TypeScript','React','MongoDB'],
       dotColor: 'bg-surface-variant'
    },
    {
      role: 'Full Stack Developer',
      company: 'Almondz Global Securities Ltd.',
      period: 'Dec 2021 - Sep 2022',
      description: [
        'Developed the Learning Management System used for internal training and employee upskilling.',
        'Worked on internal financial and operations management systems.',
        'Built frontend features using Angular and backend services with Node.js.',
        'Integrated SQL databases and optimized complex queries for reporting modules.'
      ],
      tags: ['Angular', 'Node.js', 'SQL', 'Full Stack', 'JavaScript', 'MongoDB'],
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
