import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './loading-spinner.html',
})
export class LoadingSpinner implements OnInit {
  protected loadedAt: number = Date.now();

  ngOnInit() {
    this.loadedAt = Date.now();
  }

  protected readonly Date = Date;
}
