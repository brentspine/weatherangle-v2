import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CurrentUser, Place } from '../models/auth.models';
import { AuthService } from './auth.service';
import { UserApiService } from './user-api.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly userApi = inject(UserApiService);
  private readonly authService = inject(AuthService);

  setStartLocation(place: Place): Observable<void> {
    return this.userApi
      .setStartLocation(place)
      .pipe(tap(() => this.patchCurrentUser((user) => ({ ...user, startLocation: place }))));
  }

  clearStartLocation(): Observable<void> {
    return this.userApi
      .clearStartLocation()
      .pipe(tap(() => this.patchCurrentUser((user) => ({ ...user, startLocation: null }))));
  }

  addFavourite(place: Place): Observable<void> {
    return this.userApi.addFavourite(place).pipe(
      tap(() =>
        this.patchCurrentUser((user) =>
          user.favourites.some((fav) => isSamePlace(fav, place))
            ? user
            : { ...user, favourites: [...user.favourites, place] },
        ),
      ),
    );
  }

  removeFavourite(place: Place): Observable<void> {
    return this.userApi.removeFavourite(place).pipe(
      tap(() =>
        this.patchCurrentUser((user) => ({
          ...user,
          favourites: user.favourites.filter((fav) => !isSamePlace(fav, place)),
        })),
      ),
    );
  }

  isStartLocation(place: Place): boolean {
    const startLocation = this.authService.currentUser()?.startLocation;
    return !!startLocation && isSamePlace(startLocation, place);
  }

  isFavourite(place: Place): boolean {
    const favourites = this.authService.currentUser()?.favourites ?? [];
    return favourites.some((fav) => isSamePlace(fav, place));
  }

  private patchCurrentUser(updater: (user: CurrentUser) => CurrentUser): void {
    const current = this.authService.currentUser();
    if (!current) {
      return;
    }
    this.authService.currentUser.set(updater(current));
  }
}

function isSamePlace(a: Place, b: Place): boolean {
  return a.lat === b.lat && a.lon === b.lon;
}
