import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { isInternal, parseInline } from './inline';

/** Renders one run of post text, with its inline code, emphasis and links. */
@Component({
  selector: 'app-inline-text',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (token of tokens(); track $index) {
      @switch (token.kind) {
        @case ('code') {
          <code
            class="rounded-md bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[0.88em] text-gray-900 dark:text-gray-100"
            >{{ token.text }}</code
          >
        }
        @case ('strong') {
          <strong class="font-bold text-gray-900 dark:text-white">{{ token.text }}</strong>
        }
        @case ('em') {
          <em>{{ token.text }}</em>
        }
        @case ('link') {
          @if (internal(token.href)) {
            <a
              [routerLink]="token.href"
              class="font-semibold text-tertiary underline underline-offset-4"
              >{{ token.text }}</a
            >
          } @else {
            <a
              [href]="token.href"
              target="_blank"
              rel="noopener noreferrer"
              class="font-semibold text-tertiary underline underline-offset-4"
              >{{ token.text }}</a
            >
          }
        }
        @default {
          {{ token.text }}
        }
      }
    }`,
})
export class InlineTextComponent {
  readonly text = input.required<string>();
  readonly tokens = computed(() => parseInline(this.text()));
  readonly internal = isInternal;
}
