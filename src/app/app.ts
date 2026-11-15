import { Component, afterNextRender, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BackgroundService } from './core/services/background-service';
import { PrefetchService } from './core/services/prefetch.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly background = inject(BackgroundService).currentBackground;

  constructor() {
    const prefetchService = inject(PrefetchService);
    afterNextRender(() => prefetchService.runWhenIdle());
  }
}
