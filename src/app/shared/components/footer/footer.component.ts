import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SITE } from '../../../core/site.config';

@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  readonly site = SITE;
  readonly currentYear = new Date().getFullYear();
}
