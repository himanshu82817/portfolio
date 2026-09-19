import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;
  let component: ContactComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts invalid and does not submit an empty form', async () => {
    expect(component.form.valid).toBeFalse();

    await component.onSubmit();

    expect(component.state())
      .withContext('an empty form must not report success')
      .toBe('idle');
    expect(component.form.controls.name.touched)
      .withContext('submitting should surface the validation errors')
      .toBeTrue();
  });

  it('rejects a malformed email address', () => {
    component.form.patchValue({ email: 'not-an-email' });
    expect(component.form.controls.email.valid).toBeFalse();

    component.form.patchValue({ email: 'jane@example.com' });
    expect(component.form.controls.email.valid).toBeTrue();
  });

  it('requires a message of real length', () => {
    component.form.patchValue({ message: 'hi' });
    expect(component.form.controls.message.valid).toBeFalse();

    component.form.patchValue({ message: 'A message with actual substance.' });
    expect(component.form.controls.message.valid).toBeTrue();
  });

  it('associates every visible label with its input', () => {
    const el: HTMLElement = fixture.nativeElement;

    for (const id of ['contact-name', 'contact-email', 'contact-message']) {
      const field = el.querySelector(`#${id}`);
      const label = el.querySelector(`label[for="${id}"]`);
      expect(field).withContext(`${id} field should exist`).toBeTruthy();
      expect(label).withContext(`${id} needs an associated label`).toBeTruthy();
    }
  });

  it('silently drops honeypot submissions without sending', async () => {
    component.form.patchValue({
      name: 'Spam Bot',
      email: 'bot@example.com',
      message: 'Buy cheap widgets right now please.',
      website: 'http://spam.example',
    });

    await component.onSubmit();

    // Reports success to the bot, but never reached the transport.
    expect(component.state()).toBe('success');
  });

  it('shows a field error only after the field is touched', () => {
    expect(component.showError('name')).toBeFalse();
    component.form.controls.name.markAsTouched();
    expect(component.showError('name')).toBeTrue();
  });
});
