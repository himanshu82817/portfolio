import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';
import { HapticService } from '../../../core/haptic.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styles: []
})
export class NavbarComponent {
  constructor(public themeService: ThemeService, private hapticService: HapticService) {}

  toggleTheme() {
    this.themeService.toggleTheme();
    this.hapticService.vibrate();
  }
}
