import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, catchError, concatMap, filter, from, map, of, switchMap, timer } from 'rxjs';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BackgroundService } from '../../core/services/background-service';
import { I18nService } from '../../core/services/i18n.service';
import { LocationService } from '../../core/services/location.service';
import { SurpriseLocationService } from '../../core/services/surprise-location.service';
import { UserService } from '../../core/services/user.service';
import { Place } from '../../core/models/auth.models';
import { Location } from '../../core/models/location.models';
import { Header } from '../../shared/components/header/header';
import { IconToggleButton } from '../../shared/components/icon-toggle-button/icon-toggle-button';
import { SecurityPanel } from './components/security-panel/security-panel';

@Component({
  selector: 'app-account',
  imports: [Header, RouterLink, IconToggleButton, SecurityPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account.html',
  styleUrl: './account.scss',
})
export class Account {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly locationService = inject(LocationService);
  private readonly surpriseLocationService = inject(SurpriseLocationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly i18n = inject(I18nService);
  protected readonly currentUser = this.authService.currentUser;

  // favourites
  protected readonly favouriteNames = signal<Map<string, string>>(new Map());
  protected readonly suggestedPlaces = signal<Place[]>([]);
  protected readonly showSuggestions = signal(false);

  // Start location pinned first, then favourites (start location excluded if already a favourite)
  protected readonly savedPlaces = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    const favs = user.favourites;
    const start = user.startLocation;
    if (!start) return favs;
    const startInFavs = favs.some((f) => f.lat === start.lat && f.lon === start.lon);
    return startInFavs
      ? [start, ...favs.filter((f) => !(f.lat === start.lat && f.lon === start.lon))]
      : [start, ...favs];
  });

  // Snapshot taken at page load; removed places stay visible until reload/navigation.
  // New places added this session are appended after the snapshot.
  private initialSavedPlaces: Place[] = [];
  protected readonly displayedSavedPlaces = computed(() => {
    const current = this.savedPlaces();
    const initialKeys = new Set(this.initialSavedPlaces.map((p) => this.favouriteKey(p)));
    const newPlaces = current.filter((p) => !initialKeys.has(this.favouriteKey(p)));
    return [...this.initialSavedPlaces, ...newPlaces];
  });

  constructor() {
    inject(BackgroundService).resetToDefault();
    this.initialSavedPlaces = this.savedPlaces();

    const suggestions = this.surpriseLocationService.getSuggestions();
    this.suggestedPlaces.set(suggestions);
    this.geocodePlaces(suggestions);

    effect(() => {
      const user = this.currentUser();
      if (!user) return;
      const places = [...(user.startLocation ? [user.startLocation] : []), ...user.favourites];
      this.geocodePlaces(places);
    });
  }

  private geocodePlaces(places: Place[]): void {
    const names = untracked(() => this.favouriteNames());
    const toFetch = places.filter((p) => !names.has(this.favouriteKey(p)));
    if (!toFetch.length) return;

    const networkPlaces: Place[] = [];
    for (const place of toFetch) {
      const cached = this.locationService.reverseGeocodeFromCache(place.lat, place.lon);
      if (cached) {
        const key = this.favouriteKey(place);
        this.favouriteNames.update((m) => {
          const next = new Map(m);
          next.set(key, cached.name || cached.displayName.split(',')[0] || '');
          return next;
        });
      } else {
        networkPlaces.push(place);
      }
    }

    if (!networkPlaces.length) return;

    // Nominatim usage policy: max 1 request/second. concatMap + 1200ms timer enforces this.
    from(networkPlaces)
      .pipe(
        concatMap((place, index) =>
          timer(index === 0 ? 0 : 1200).pipe(
            switchMap(() => this.locationService.reverseGeocode(place.lat, place.lon)),
            map((location) => ({ place, location })),
            catchError((): Observable<null> => of(null)),
          ),
        ),
        filter((result): result is { place: Place; location: Location } => result !== null),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ place, location }) => {
        const key = this.favouriteKey(place);
        this.favouriteNames.update((m) => {
          const next = new Map(m);
          next.set(key, location.name || location.displayName.split(',')[0] || '');
          return next;
        });
      });
  }

  protected onRefreshSuggestions(): void {
    const fresh = this.surpriseLocationService.refreshSuggestions();
    this.suggestedPlaces.set(fresh);
    this.geocodePlaces(fresh);
  }

  protected onToggleSuggestions(): void {
    if (this.showSuggestions()) {
      const fresh = this.surpriseLocationService.refreshSuggestions();
      this.suggestedPlaces.set(fresh);
      this.geocodePlaces(fresh);
    } else {
      this.showSuggestions.set(true);
    }
  }

  protected favouriteKey(place: Place): string {
    return `${place.lat},${place.lon}`;
  }

  protected favouriteName(place: Place): string {
    return (
      this.favouriteNames().get(this.favouriteKey(place)) ??
      `${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}`
    );
  }

  protected isFavouritePlace(place: Place): boolean {
    return (this.currentUser()?.favourites ?? []).some(
      (f) => f.lat === place.lat && f.lon === place.lon,
    );
  }

  protected isStartPage(place: Place): boolean {
    const start = this.currentUser()?.startLocation;
    return !!start && start.lat === place.lat && start.lon === place.lon;
  }

  protected onToggleStar(place: Place, active: boolean): void {
    if (active && this.displayedSavedPlaces().length === 0) {
      this.showSuggestions.set(true);
    }
    const action = active
      ? this.userService.setStartLocation(place)
      : this.userService.clearStartLocation();
    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected onToggleFavourite(place: Place, active: boolean): void {
    if (active && this.displayedSavedPlaces().length === 0) {
      this.showSuggestions.set(true);
    }
    const action = active
      ? this.userService.addFavourite(place)
      : this.userService.removeFavourite(place);
    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected onLogout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
