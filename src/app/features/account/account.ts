import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BackgroundService } from '../../core/services/background-service';
import { Header } from '../../shared/components/header/header';

@Component({
  selector: 'app-account',
  imports: [Header],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;

  constructor() {
    inject(BackgroundService).resetToDefault();
  }

  protected onLogout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
