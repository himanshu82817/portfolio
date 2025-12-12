import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Using Angular Signals for reactive state management
  darkMode = signal<boolean>(false);

  constructor() {
    this.initializeTheme();
    
    // Effect to update the HTML class whenever the signal changes
    effect(() => {
      if (this.darkMode()) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    });
  }

  toggleTheme() {
    this.darkMode.update(val => !val);
  }

  private initializeTheme() {
    // Check local storage first
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme) {
      this.darkMode.set(storedTheme === 'dark');
    } else {
      // Fallback to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.darkMode.set(prefersDark);
    }
  }
}