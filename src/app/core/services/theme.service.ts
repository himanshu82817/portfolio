import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

/**
 * Owns the `dark` class on <html>.
 *
 * Three states, not two: an explicit 'light'/'dark' choice is persisted, while
 * 'system' is the default and is deliberately *not* persisted — so a visitor who
 * never touched the toggle keeps following their OS as it changes through the day.
 *
 * The first paint is handled by the inline script in index.html, which applies the
 * exact same rule before any CSS loads. This service takes over from there; keep
 * the two in sync if you change the resolution logic.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly media = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

  /** What the user picked. 'system' means "follow the OS". */
  readonly mode = signal<ThemeMode>(this.readStoredMode());

  /** Live OS preference, updated when the user changes it while the tab is open. */
  private readonly systemPrefersDark = signal<boolean>(this.media?.matches ?? false);

  /** The resolved boolean the templates bind to. */
  readonly darkMode = computed(() =>
    this.mode() === 'system' ? this.systemPrefersDark() : this.mode() === 'dark'
  );

  constructor() {
    this.media?.addEventListener('change', (e: MediaQueryListEvent) =>
      this.systemPrefersDark.set(e.matches)
    );

    effect(() => {
      const dark = this.darkMode();
      const root = document.documentElement;
      root.classList.toggle('dark', dark);
      // Lets the browser theme native scrollbars, form controls and autofill.
      root.style.colorScheme = dark ? 'dark' : 'light';
    });
  }

  /** Cycles light → dark → light, committing an explicit choice each time. */
  toggleTheme(): void {
    this.setMode(this.darkMode() ? 'light' : 'dark');
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    try {
      if (mode === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Private mode / storage disabled — the theme still applies for this session.
    }
  }

  private readStoredMode(): ThemeMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // Ignore and fall through to 'system'.
    }
    return 'system';
  }
}
