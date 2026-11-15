import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ErrorPage } from '../../shared/components/error-page/error-page';
import { Header } from '../../shared/components/header/header';

@Component({
  selector: 'app-not-found',
  imports: [Header, ErrorPage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './not-found.html',
})
export class NotFound {}
