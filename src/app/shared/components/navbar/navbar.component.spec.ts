import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Component } from '@angular/core';

import { NavbarComponent } from './navbar.component';

@Component({ standalone: true, template: '' })
class StubComponent {}

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([
          { path: '', component: StubComponent },
          { path: 'about', component: StubComponent },
          { path: 'projects', component: StubComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
  });

  it('gives every nav link an accessible name, even though labels are hidden on mobile', () => {
    // [routerLink] is a property binding, so there is no routerLink attribute in
    // the DOM to select on — assert against the rendered accessible names instead.
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('nav a')
    );
    const names = links.map(a => a.getAttribute('aria-label'));

    expect(names).withContext('the home monogram link').toContain('Home');
    expect(names).toContain('About');
    expect(names).toContain('Experience');
    expect(names).toContain('Projects');
    expect(names).toContain("Let's Talk");

    expect(names.every(n => !!n && n.length > 1))
      .withContext('every link needs a non-empty accessible name')
      .toBeTrue();
  });

  it('keeps the home link on screen at every width', () => {
    // It used to be `hidden sm:flex`, which left phones with no route back to the hero.
    const home: HTMLAnchorElement = fixture.nativeElement.querySelector('nav a[aria-label="Home"]');
    const classes = Array.from(home.classList);
    expect(classes).not.toContain('hidden');
    expect(classes.some(c => /^(sm|md|lg):(flex|block|inline)/.test(c)))
      .withContext('visibility must not depend on a breakpoint')
      .toBeFalse();
  });

  it('hides decorative icon ligatures from screen readers', () => {
    const icons = fixture.nativeElement.querySelectorAll('.material-symbols-outlined');
    expect(icons.length).toBeGreaterThan(0);
    icons.forEach((icon: HTMLElement) => {
      expect(icon.getAttribute('aria-hidden'))
        .withContext('otherwise the raw ligature text is announced')
        .toBe('true');
    });
  });

  it('marks the active route with aria-current', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/about');
    fixture.detectChanges();

    const active = fixture.nativeElement.querySelector('a[aria-current="page"]');
    expect(active).toBeTruthy();
    expect(active.getAttribute('aria-label')).toBe('About');
  });

  it('exposes the theme toggle state and gives it a stateful name', () => {
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button[aria-pressed]');
    expect(button).toBeTruthy();

    const before = button.getAttribute('aria-pressed');
    const labelBefore = button.getAttribute('aria-label');

    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-pressed')).not.toBe(before);
    expect(button.getAttribute('aria-label')).not.toBe(labelBefore);
  });
});
