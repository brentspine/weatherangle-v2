import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Forecast } from '../models/weather.models';

export type WeatherDetailLevel = 'preview' | 'detailed' | 'full';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/weather`;

  getWeather(
    latitude: number,
    longitude: number,
    detailLevel: WeatherDetailLevel = 'preview',
    pastDays: number = 0,
    forecastDays: number = 7,
  ): Observable<Forecast> {
    let params = new HttpParams()
      .set('lat', latitude.toString())
      .set('lon', longitude.toString())
      .set('detailLevel', detailLevel);

    if (pastDays > 0) {
      params = params.set('pastDays', pastDays.toString());
    }
    if (forecastDays !== 7) {
      params = params.set('forecastDays', forecastDays.toString());
    }

    return this.http.get<Forecast>(`${this.baseUrl}/forecast`, { params });
  }
}
