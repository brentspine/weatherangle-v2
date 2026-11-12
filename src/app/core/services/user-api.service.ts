import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, Place } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/user`;

  setStartLocation(place: Place): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/start-location`, place);
  }

  clearStartLocation(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/start-location/clear`, {});
  }

  addFavourite(place: Place): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/favourites`, place);
  }

  removeFavourite(place: Place): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/favourites/remove`, place);
  }

  changeUsername(username: string): Observable<AuthResponse> {
    return this.http.patch<AuthResponse>(`${this.baseUrl}/username`, { username });
  }

  deleteAccount(password: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/user`, { body: { password } });
  }
}
