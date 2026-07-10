import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {TtlCache} from '../../shared/utils/ttl-cache';
import {Forecast} from '../../core/models/weather.models';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly http= inject(HttpClient);
  private readonly cache = new TtlCache<string, Forecast>(15*60*1000)
}
