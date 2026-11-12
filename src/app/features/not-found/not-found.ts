import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ErrorPage } from '../../shared/components/error-page/error-page';

@Component({
  selector: 'app-not-found',
  imports: [ErrorPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-error-page [statusCode]="404" />`,
})
export class NotFound {}
