import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgbTypeahead, NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import {
  OperatorFunction,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
} from 'rxjs';
import { Location } from '../../../core/models/location.models';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';
import { LocationService } from '../../../core/services/location.service';
import { SurpriseLocationService } from '../../../core/services/surprise-location.service';
@Component({
  selector: 'app-header',
  imports: [RouterLink, FormsModule, NgbTypeahead],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly authService = inject(AuthService);
  private readonly locationService = inject(LocationService);
  private readonly surpriseLocationService = inject(SurpriseLocationService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  protected readonly i18n = inject(I18nService);
  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly menuOpen = signal(false);
  protected readonly searchTerm = signal('');

  private readonly surpriseItem = (): Location => ({
    lat: 0,
    lon: 0,
    displayName: this.i18n.t('header.surpriseMe'),
  });

  protected readonly search: OperatorFunction<string, readonly Location[]> = (text$) =>
    text$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap((term) => {
        const query = term.trim();
        if (query.length === 0) {
          return of([this.surpriseItem()]);
        }
        if (query.length < 2) {
          return of([]);
        }
        return this.locationService.search({ query }).pipe(
          map((locations) => (locations.length === 0 ? [this.surpriseItem()] : locations)),
          catchError(() => of([this.surpriseItem()])),
        );
      }),
    );

  protected readonly resultFormatter = (location: Location): string => location.displayName;
  protected readonly inputFormatter = (location: Location): string => location.displayName;

  protected onSelectLocation(event: NgbTypeaheadSelectItemEvent<Location>): void {
    event.preventDefault();
    this.searchTerm.set('');

    if (event.item.lat === 0 && event.item.lon === 0) {
      const { lat, lon } = this.surpriseLocationService.getRandomLocation();
      this.router.navigate(['/places', `@${lat},${lon}`]);
      return;
    }

    this.router.navigate(['/places', `@${event.item.lat},${event.item.lon}`], {
      state: { location: event.item },
    });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected onLogout(): void {
    this.menuOpen.set(false);
    this.authService.logout();
    this.router.navigateByUrl('/');
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }
}
