import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { visiblePosts } from './registry';

@Component({
  selector: 'app-writing-list',
  standalone: true,
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './writing-list.component.html',
})
export class WritingListComponent {
  /** Published posts, plus drafts in development builds. */
  readonly posts = visiblePosts();
}
