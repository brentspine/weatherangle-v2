import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { OverpassService, bboxDiagonalKm, placeTypesForBbox, viewportCacheKey } from './overpass.service';
import { BoundingBox, OverpassResponse } from '../models/overpass.models';

// Wiesbaden/Mainz/Frankfurt (~50 km diagonal)
const SMALL_BBOX: BoundingBox = [49.9, 50.2, 7.9, 8.4];
// West/Central Deutschland (~440 km diagonal)
const MEDIUM_BBOX: BoundingBox = [48.0, 51.0, 6.0, 10.0];
// World-scale viewport
const HUGE_BBOX: BoundingBox = [-60, 70, -170, 170];

const expectOverpassRequest = (httpMock: HttpTestingController) =>
  httpMock.expectOne((req) => req.method === 'POST' && req.url.endsWith('/interpreter'));

describe('OverpassService', () => {
  let service: OverpassService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OverpassService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('bboxDiagonalKm', () => {
    it('should compute a small diagonal for a city-scale bbox', () => {
      expect(bboxDiagonalKm(SMALL_BBOX)).toBeLessThan(60);
    });

    it('should compute a larger diagonal for a region-scale bbox', () => {
      expect(bboxDiagonalKm(MEDIUM_BBOX)).toBeGreaterThan(300);
      expect(bboxDiagonalKm(MEDIUM_BBOX)).toBeLessThan(900);
    });
  });

  describe('placeTypesForBbox', () => {
    it('should include villages for a small bbox', () => {
      expect(placeTypesForBbox(SMALL_BBOX)).toEqual(['city', 'town', 'village']);
    });

    it('should restrict to cities only for a region-scale bbox', () => {
      expect(placeTypesForBbox(MEDIUM_BBOX)).toEqual(['city']);
    });

    it('should return no place types beyond the max fetch diagonal', () => {
      expect(placeTypesForBbox(HUGE_BBOX)).toEqual([]);
    });
  });

  describe('viewportCacheKey', () => {
    it('should produce the same key for two bboxes rounded to the same grid cell', () => {
      const a: BoundingBox = [49.901, 50.199, 7.902, 8.398];
      const b: BoundingBox = [49.899, 50.201, 7.898, 8.402];
      expect(viewportCacheKey(a)).toBe(viewportCacheKey(b));
    });

    it('should produce different keys for bboxes in different place-type tiers', () => {
      expect(viewportCacheKey(SMALL_BBOX)).not.toBe(viewportCacheKey(MEDIUM_BBOX));
    });
  });

  describe('nearbySettlements', () => {
    it('should not issue a request when the bbox is too large to be useful', () => {
      service.nearbySettlements(HUGE_BBOX).subscribe((result) => {
        expect(result).toEqual([]);
      });
      httpMock.expectNone(() => true);
    });

    it('should sort by population descending, treating missing population as 0 with a place-rank tiebreak', () => {
      const mockResponse: OverpassResponse = {
        elements: [
          { type: 'node', id: 1, lat: 50.0, lon: 8.0, tags: { place: 'village', name: 'SmallVillage' } },
          {
            type: 'node',
            id: 2,
            lat: 50.05,
            lon: 8.05,
            tags: { place: 'city', name: 'Frankfurt', population: '750000' },
          },
          { type: 'node', id: 3, lat: 50.1, lon: 8.1, tags: { place: 'town', name: 'NoPopTown' } },
          { type: 'node', id: 4, lat: 50.15, lon: 8.15, tags: { place: 'city', name: 'NoPopCity' } },
        ],
      };

      let result: string[] = [];
      service.nearbySettlements(SMALL_BBOX).subscribe((settlements) => {
        result = settlements.map((s) => s.name);
      });

      const req = expectOverpassRequest(httpMock);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);

      // Frankfurt gewinnt wegen Einwohnern
      expect(result).toEqual(['Frankfurt', 'NoPopCity', 'NoPopTown', 'SmallVillage']);
    });

    it('should skip nodes without a name tag', () => {
      const mockResponse: OverpassResponse = {
        elements: [
          { type: 'node', id: 1, lat: 50.0, lon: 8.0, tags: { place: 'city' } },
          { type: 'node', id: 2, lat: 50.05, lon: 8.05, tags: { place: 'city', name: 'Frankfurt' } },
        ],
      };

      let result: string[] = [];
      service.nearbySettlements(SMALL_BBOX).subscribe((settlements) => {
        result = settlements.map((s) => s.name);
      });

      expectOverpassRequest(httpMock).flush(mockResponse);
      expect(result).toEqual(['Frankfurt']);
    });

    it('should reuse the cached observable for the same bbox instead of issuing a second request', () => {
      const mockResponse: OverpassResponse = { elements: [] };

      service.nearbySettlements(SMALL_BBOX).subscribe();
      expectOverpassRequest(httpMock).flush(mockResponse);

      service.nearbySettlements(SMALL_BBOX).subscribe();
      httpMock.expectNone(() => true);
    });
  });
});
