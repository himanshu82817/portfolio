import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { SITE } from '../../../../core/site.config';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly site = SITE;
  readonly state = signal<SubmitState>('idle');
  readonly errorMessage = signal<string>('');

  /** True when no form provider is configured and we fall back to mailto. */
  readonly usesMailtoFallback = !SITE.contactFormKey;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    /** Honeypot. Hidden from people, irresistible to bots — a filled value is dropped. */
    website: [''],
  });

  /** Shows an error only once the field has actually been interacted with. */
  showError(field: 'name' | 'email' | 'message'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  async onSubmit(): Promise<void> {
    if (this.state() === 'submitting') return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Silently accept-and-discard: a bot gets a success page, no mail is sent.
    if (this.form.controls.website.value) {
      this.state.set('success');
      return;
    }

    const { name, email, message } = this.form.getRawValue();

    if (this.usesMailtoFallback) {
      this.openMailClient(name, email, message);
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set('');

    try {
      await firstValueFrom(
        this.http.post(WEB3FORMS_ENDPOINT, {
          access_key: SITE.contactFormKey,
          subject: `Portfolio enquiry from ${name}`,
          from_name: name,
          name,
          email,
          message,
        })
      );
      this.state.set('success');
      this.form.reset();
    } catch {
      this.state.set('error');
      this.errorMessage.set(
        `Something went wrong sending that. You can email me directly at ${SITE.email}.`
      );
    }
  }

  /** Hands the message to the visitor's own mail client, pre-filled. */
  private openMailClient(name: string, email: string, message: string): void {
    const subject = encodeURIComponent(`Portfolio enquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
    this.state.set('success');
  }

  reset(): void {
    this.state.set('idle');
    this.errorMessage.set('');
  }
}
