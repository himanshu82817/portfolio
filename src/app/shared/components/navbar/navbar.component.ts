import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ThemeService } from '../../../core/services/theme.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  /** Classes applied while this route is active. The foreground is paired with
   *  the background deliberately — white fails contrast on the yellow. */
  activeClass: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgClass, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  readonly themeService = inject(ThemeService);

  readonly items: readonly NavItem[] = [
    {
      path: '/about',
      label: 'About',
      icon: 'person',
      activeClass: 'bg-[#4286f5] text-white shadow-elevation-1',
    },
    {
      path: '/experience',
      label: 'Experience',
      icon: 'work_history',
      activeClass: 'bg-[#ea4335] text-white shadow-elevation-1',
    },
    {
      path: '/projects',
      label: 'Projects',
      icon: 'grid_view',
      // Dark ink on the yellow: white would land at ~1.9:1.
      activeClass: 'bg-[#fabc05] text-[#181811] shadow-elevation-1',
    },
    {
      path: '/contact',
      label: "Let's Talk",
      icon: 'send',
      activeClass: 'bg-[#36a852] text-white shadow-elevation-1',
    },
  ];

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
