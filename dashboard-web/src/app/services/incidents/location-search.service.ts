import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface LocationSuggestion {
  label: string;
  latitude: number;
  longitude: number;
}

interface PhotonResponse {
  features: Array<{
    geometry: {
      coordinates: [number, number];
    };
    properties: {
      name?: string;
      street?: string;
      housenumber?: string;
      postcode?: string;
      city?: string;
      state?: string;
      country?: string;
    };
  }>;
}

@Injectable({ providedIn: 'root' })
export class LocationSearchService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'https://photon.komoot.io/api/';

  search(query: string): Observable<LocationSuggestion[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('limit', 6)
      .set('lat', 50.06)
      .set('lon', 19.94)
      .set('lang', 'en');

    return this.http.get<PhotonResponse>(this.endpoint, { params }).pipe(
      map((response) =>
        response.features
          .map((feature) => ({
            label: this.formatAddress(feature.properties),
            longitude: feature.geometry.coordinates[0],
            latitude: feature.geometry.coordinates[1],
          }))
          .filter(
            (suggestion) =>
              suggestion.label.length > 0 &&
              Number.isFinite(suggestion.latitude) &&
              Number.isFinite(suggestion.longitude),
          ),
      ),
    );
  }

  private formatAddress(
    properties: PhotonResponse['features'][number]['properties'],
  ): string {
    const street = [properties.street, properties.housenumber]
      .filter(Boolean)
      .join(' ');
    return [
      properties.name,
      street && street !== properties.name ? street : undefined,
      properties.postcode,
      properties.city,
      properties.state,
      properties.country,
    ]
      .filter((part, index, parts): part is string =>
        Boolean(part) && parts.indexOf(part) === index,
      )
      .join(', ');
  }
}
