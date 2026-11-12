import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { from, of, switchMap } from 'rxjs';

import { SITE } from '../../core/site.config';
import { InlineTextComponent } from './inline-text.component';
import { Block } from './post.model';
import { findPost } from './registry';

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [DatePipe, RouterLink, InlineTextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './post.component.html',
})
export class PostComponent {
  /** Bound from the :slug route parameter by withComponentInputBinding(). */
  readonly slug = input.required<string>();

  readonly site = SITE;
  readonly post = computed(() => findPost(this.slug()));

  /** The body arrives as its own chunk; until then the header stands alone. */
  readonly blocks = toSignal(
    toObservable(this.post).pipe(
      switchMap(post => (post ? from(post.load()) : of<Block[]>([])))
    ),
    { initialValue: [] as Block[] }
  );
}
