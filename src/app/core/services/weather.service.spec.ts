import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { WeatherService } from './weather.service';
import { environment } from '../../../environments/environment';
import { Forecast } from '../models/weather.models';

describe('WeatherService', () => {
  let service: WeatherService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WeatherService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getWeather', () => {
    it('should request preview detail level by default', () => {
      const mockResponse: Forecast = {
        lat: 52.52,
        lon: 13.41,
        elevation: 38,
        generationTimeMs: 0.123,
        timezone: {
          timezone: 'Europe/Berlin',
          utcOffsetSeconds: 7200,
          timezoneAbbreviation: 'CEST',
        },
        current: {
          time: new Date('2026-07-11T12:00'),
          weatherCode: 3,
          temperature: 25.5,
        },
      };

      service.getWeather(52.52, 13.41).subscribe((forecast) => {
        expect(forecast.lat).toBe(52.52);
        expect(forecast.lon).toBe(13.41);
        expect(forecast.current?.temperature).toBe(25.5);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === `${environment.apiUrl}/weather/forecast` &&
          request.params.get('lat') === '52.52' &&
          request.params.get('lon') === '13.41' &&
          request.params.get('detailLevel') === 'preview',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass custom detail level', () => {
      const mockResponse: Forecast = {
        lat: 50.11,
        lon: 8.68,
        elevation: 112,
        generationTimeMs: 0.456,
        timezone: {
          timezone: 'Europe/Berlin',
          utcOffsetSeconds: 7200,
          timezoneAbbreviation: 'CEST',
        },
      };

      service.getWeather(50.11, 8.68, 'full').subscribe();

      const req = httpMock.expectOne(
        (request) => request.params.get('detailLevel') === 'full',
      );
      req.flush(mockResponse);
    });

    it('should pass pastDays and forecastDays when provided', () => {
      const mockResponse: Forecast = {
        lat: 49.87,
        lon: 8.65,
        elevation: 95,
        generationTimeMs: 0.789,
        timezone: {
          timezone: 'Europe/Berlin',
          utcOffsetSeconds: 7200,
          timezoneAbbreviation: 'CEST',
        },
      };

      service.getWeather(49.87, 8.65, 'detailed', 1, 14).subscribe();

      const req = httpMock.expectOne(
        (request) =>
          request.params.get('pastDays') === '1' &&
          request.params.get('forecastDays') === '14',
      );
      req.flush(mockResponse);
    });

    it('should receive daily weather with sunrise/sunset from backend', () => {
      const mockResponse: Forecast = {
        lat: 52.52,
        lon: 13.41,
        elevation: 38,
        generationTimeMs: 0.1,
        timezone: {
          timezone: 'Europe/Berlin',
          utcOffsetSeconds: 7200,
          timezoneAbbreviation: 'CEST',
        },
        daily: [
          {
            time: new Date('2026-07-11'),
            weatherCode: 3,
            temperatureMax: 28.5,
            temperatureMin: 18.3,
            sunrise: new Date('2026-07-11T05:15:00'),
            sunset: new Date('2026-07-11T21:30:00'),
          },
          {
            time: new Date('2026-07-12'),
            weatherCode: 2,
            temperatureMax: 30.2,
            temperatureMin: 19.1,
            sunrise: new Date('2026-07-12T05:16:00'),
            sunset: new Date('2026-07-12T21:29:00'),
          },
        ],
      };

      service.getWeather(52.52, 13.41).subscribe((forecast) => {
        expect(forecast.daily).toHaveLength(2);
        expect(forecast.daily![0].temperatureMax).toBe(28.5);
      });

      const req = httpMock.expectOne((request) => request.url.includes('/weather/forecast'));
      req.flush(mockResponse);
    });
  });
});
