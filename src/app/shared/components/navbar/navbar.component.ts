import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { RouterLink, RouterLinkActive } from "@angular/router";
import { animate, state, style, transition, trigger, keyframes } from '@angular/animations';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styles:`

  `,
  animations: [
    trigger('iconClick', [
        state('idle', style({ transform: 'scale(1)' })),
        state('clicked', style({ transform: 'scale(1)' })),
        transition('idle => clicked', [
            animate('400ms ease-in-out', keyframes([
                // style({ transform: 'scalex(0.8) rotate(-5deg)', offset: 0 }),
                style({ transform: 'scalex(0.8) ', offset: 0 }),
                // style({ transform: 'scalex(1.1) rotate(5deg) ', offset: 0.5 }),
                style({ transform: 'scalex(1.1) rotate(0deg) ', offset: 0.5 }),
                // style({ transform: 'scale(1.1) rotate(5deg) ', offset: 0.5 }),
                style({ transform: 'scalex(1) rotate(0)', offset: 1.0 })
            ]))
        ])
    ])
  ]
})
export class NavbarComponent {
  iconAnimationState: { [key: string]: string } = {
    about: 'idle',
    experience: 'idle',
    projects: 'idle',
    contact: 'idle'
  };

  constructor(public themeService: ThemeService) {}

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  triggerAnimation(icon: string) {
    this.iconAnimationState[icon] = 'clicked';
  }

  onAnimationEnd(icon: string) {
    this.iconAnimationState[icon] = 'idle';
  }
}
