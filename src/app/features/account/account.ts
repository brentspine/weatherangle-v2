import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { toasts, ToastSeverity } from 'brents-toasts';
import { Place } from '../../core/models/auth.models';
import { Location } from '../../core/models/location.models';
import { AuthApiService } from '../../core/services/auth-api.service';
import { AuthService } from '../../core/services/auth.service';
import { BackgroundService } from '../../core/services/background-service';
import { I18nService } from '../../core/services/i18n.service';
import { LocationService } from '../../core/services/location.service';
import { SurpriseLocationService } from '../../core/services/surprise-location.service';
import { UserApiService } from '../../core/services/user-api.service';
import { UserService } from '../../core/services/user.service';
import { Header } from '../../shared/components/header/header';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import {
  VerificationEndpoints,
  VerificationStepper,
  VerificationStepperTexts,
} from '../../shared/components/verification-stepper/verification-stepper';
import { WeatherCard } from '../../shared/components/weather-card/weather-card';

interface ResolvedFavourite {
  place: Place;
  name: string;
}

@Component({
  selector: 'app-account',
  imports: [Header, TranslatePipe, ReactiveFormsModule, RouterLink, VerificationStepper, WeatherCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account {
  private readonly authService = inject(AuthService);
  private readonly authApiService = inject(AuthApiService);
  private readonly userApiService = inject(UserApiService);
  private readonly userService = inject(UserService);
  private readonly locationService = inject(LocationService);
  private readonly surpriseService = inject(SurpriseLocationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  protected readonly i18n = inject(I18nService);

  protected readonly currentUser = this.authService.currentUser;

  // Profile state
  protected readonly editingUsername = signal(false);
  protected readonly usernameForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
  });
  protected readonly usernameLoading = signal(false);

  // Security / change password state
  protected readonly showPasswordChange = signal(false);
  protected readonly passwordForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });
  protected readonly passwordToken = signal<string | null>(null);
  protected readonly passwordEmail = signal('');
  protected readonly passwordLoading = signal(false);

  protected readonly passwordResetEndpoints: VerificationEndpoints = {
    requestCode: (email) => this.authApiService.passwordResetRequest(email).pipe(switchMap(() => of<void>(undefined))),
    verifyCode: (email, code) => this.authApiService.passwordResetVerifyCode(email, code),
  };

  protected get passwordStepperTexts(): VerificationStepperTexts {
    return {};
  }

  // Delete account state
  protected readonly showDeleteConfirm = signal(false);
  protected readonly deleteForm = this.fb.nonNullable.group({
    password: ['', Validators.required],
  });
  protected readonly deleteLoading = signal(false);

  // Places: start location
  protected readonly startLocationResource = rxResource({
    params: () => ({ sl: this.currentUser()?.startLocation ?? null }),
    stream: ({ params }) => {
      if (!params.sl) return of<Location | null>(null);
      return this.locationService
        .reverseGeocode(params.sl.lat, params.sl.lon)
        .pipe(catchError(() => of<Location | null>(null)));
    },
  });

  // Places: favourites
  protected readonly favouritesResource = rxResource({
    params: () => ({ favs: this.currentUser()?.favourites ?? [] }),
    stream: ({ params }) => {
      if (params.favs.length === 0) return of<ResolvedFavourite[]>([]);
      return forkJoin(
        params.favs.map((place) =>
          this.locationService
            .reverseGeocode(place.lat, place.lon)
            .pipe(
              catchError(() => of(null)),
              switchMap((loc) =>
                of<ResolvedFavourite>({ place, name: loc?.displayName ?? `${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}` }),
              ),
            ),
        ),
      );
    },
  });

  protected readonly randomSuggestions = computed(() => {
    if ((this.currentUser()?.favourites?.length ?? 0) > 0) return [];
    return [
      this.surpriseService.getRandomLocation(),
      this.surpriseService.getRandomLocation(),
      this.surpriseService.getRandomLocation(),
    ];
  });

  constructor() {
    inject(BackgroundService).resetToDefault();
  }

  protected startEditUsername(): void {
    this.usernameForm.patchValue({ username: this.currentUser()?.username ?? '' });
    this.editingUsername.set(true);
  }

  protected cancelEditUsername(): void {
    this.editingUsername.set(false);
  }

  protected saveUsername(): void {
    if (this.usernameForm.invalid || this.usernameLoading()) return;
    this.usernameLoading.set(true);
    const { username } = this.usernameForm.getRawValue();
    this.userApiService
      .changeUsername(username)
      .pipe(
        tap((authResponse) => {
          this.authService.updateTokens(authResponse);
          const user = this.currentUser();
          if (user) this.authService.currentUser.set({ ...user, username });
        }),
      )
      .subscribe({
        next: () => {
          this.usernameLoading.set(false);
          this.editingUsername.set(false);
          toasts.showToast(this.i18n.translate('account.username_updated'), { severity: ToastSeverity.SUCCESS });
        },
        error: () => {
          this.usernameLoading.set(false);
        },
      });
  }

  protected onPasswordVerified(event: { email: string; token: string }): void {
    this.passwordToken.set(event.token);
    this.passwordEmail.set(event.email);
  }

  protected submitNewPassword(): void {
    const token = this.passwordToken();
    if (!token || this.passwordForm.invalid || this.passwordLoading()) return;
    this.passwordLoading.set(true);
    const { newPassword } = this.passwordForm.getRawValue();
    this.authApiService
      .passwordReset({ resetToken: token, newPassword })
      .subscribe({
        next: () => {
          this.passwordLoading.set(false);
          this.showPasswordChange.set(false);
          this.passwordToken.set(null);
          this.passwordForm.reset();
          toasts.showToast(this.i18n.translate('account.password_changed'), { severity: ToastSeverity.SUCCESS });
        },
        error: () => {
          this.passwordLoading.set(false);
        },
      });
  }

  protected removeFavourite(place: Place): void {
    this.userService.removeFavourite(place).subscribe({
      error: (err) => console.error('Failed to remove favourite', err),
    });
  }

  protected clearStartLocation(): void {
    this.userService.clearStartLocation().subscribe({
      error: (err) => console.error('Failed to clear start location', err),
    });
  }

  protected confirmDelete(): void {
    if (this.deleteForm.invalid || this.deleteLoading()) return;
    this.deleteLoading.set(true);
    const { password } = this.deleteForm.getRawValue();
    this.userApiService
      .deleteAccount(password)
      .subscribe({
        next: () => {
          this.authService.logout();
          this.router.navigateByUrl('/');
        },
        error: () => {
          this.deleteLoading.set(false);
        },
      });
  }

  protected onLogout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
