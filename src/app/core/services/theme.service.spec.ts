import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

/**
 * These cover the three behaviours that were actually broken before:
 * a theme was persisted even when the visitor never chose one, the OS preference
 * was sampled once and then ignored, and the toggle was the only way in.
 */
describe('ThemeService', () => {
  let mediaListeners: Array<(e: MediaQueryListEvent) => void>;

  /** Stubs matchMedia so the "OS" preference is controllable. */
  function stubMatchMedia(prefersDark: boolean): void {
    mediaListeners = [];
    spyOn(window, 'matchMedia').and.returnValue({
      matches: prefersDark,
      media: '(prefers-color-scheme: dark)',
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) =>
        mediaListeners.push(cb),
      removeEventListener: () => {},
    } as unknown as MediaQueryList);
  }

  function emitSystemChange(matches: boolean): void {
    mediaListeners.forEach(cb => cb({ matches } as MediaQueryListEvent));
  }

  function create(): ThemeService {
    TestBed.configureTestingModule({});
    return TestBed.inject(ThemeService);
  }

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('defaults to following the system, without writing to storage', () => {
    stubMatchMedia(true);
    const service = create();

    expect(service.mode()).toBe('system');
    expect(service.darkMode()).toBeTrue();
    expect(localStorage.getItem('theme'))
      .withContext('a theme the visitor never chose must not be persisted')
      .toBeNull();
  });

  it('follows the OS preference when it changes mid-session', () => {
    stubMatchMedia(false);
    const service = create();
    expect(service.darkMode()).toBeFalse();

    emitSystemChange(true);
    TestBed.flushEffects();

    expect(service.darkMode()).toBeTrue();
  });

  it('stops following the OS once the visitor picks a theme', () => {
    stubMatchMedia(false);
    const service = create();

    service.toggleTheme();
    TestBed.flushEffects();
    expect(service.mode()).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    emitSystemChange(false);
    TestBed.flushEffects();
    expect(service.darkMode())
      .withContext('an explicit choice outranks the OS')
      .toBeTrue();
  });

  it('restores a previously stored choice', () => {
    localStorage.setItem('theme', 'dark');
    stubMatchMedia(false);
    const service = create();

    expect(service.mode()).toBe('dark');
    expect(service.darkMode()).toBeTrue();
  });

  it('applies the dark class and color-scheme to <html>', () => {
    stubMatchMedia(false);
    const service = create();
    TestBed.flushEffects();
    expect(document.documentElement.classList.contains('dark')).toBeFalse();

    service.setMode('dark');
    TestBed.flushEffects();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('clears the stored value when returning to system mode', () => {
    localStorage.setItem('theme', 'dark');
    stubMatchMedia(false);
    const service = create();

    service.setMode('system');
    TestBed.flushEffects();

    expect(localStorage.getItem('theme')).toBeNull();
    expect(service.darkMode()).toBeFalse();
  });
});
