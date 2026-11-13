import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SITE, yearsOfExperience } from '../../../../core/site.config';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.component.html',
})
export class HeroComponent {
  readonly site = SITE;

  /** Derived from SITE.careerStart, so it can never contradict the timeline
   *  on the Experience page or quietly go stale. */
  readonly stats = [
    {
      label: 'Years experience',
      value: `${yearsOfExperience()}+`,
      icon: 'dns',
      iconClass: 'bg-tertiary/10 text-tertiary',
    },
    {
      label: 'LeetCode Knight',
      value: 'Top 2.71%',
      icon: 'emoji_events',
      iconClass: 'bg-primary/20 text-yellow-700 dark:text-primary',
    },
  ];
}
