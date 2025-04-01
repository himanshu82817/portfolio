import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeKey = 'theme';
  private isDarkMode = new BehaviorSubject<boolean>(false);
  isDarkMode$ = this.isDarkMode.asObservable();

  constructor() {
    this.loadTheme();
  }

  toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem(this.themeKey, isDark ? 'dark' : 'light');
    this.isDarkMode.next(isDark);
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem(this.themeKey) || 'light';
    const isDark = savedTheme === 'dark';
    if (isDark) document.body.classList.add('dark-mode');
    this.isDarkMode.next(isDark);
  }
}
