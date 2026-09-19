import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('creates the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a skip link that targets the main landmark', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const skip = el.querySelector<HTMLAnchorElement>('a[href="#main-content"]');
    expect(skip)
      .withContext('keyboard users need a way past the nav')
      .toBeTruthy();
    expect(skip!.textContent!.trim()).toBe('Skip to content');

    const main = el.querySelector('main#main-content');
    expect(main).withContext('the skip link must have a target').toBeTruthy();
    expect(main!.getAttribute('tabindex')).toBe('-1');
  });

  it('moves focus to main instead of navigating when the skip link is used', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const skip = el.querySelector<HTMLAnchorElement>('a[href="#main-content"]')!;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    skip.dispatchEvent(click);

    // With <base href="/">, following the href would load "/#main-content" — the
    // home page — from any other route.
    expect(click.defaultPrevented)
      .withContext('the browser must not follow the base-relative href')
      .toBeTrue();
    expect(document.activeElement).toBe(el.querySelector('main#main-content'));
  });
});
