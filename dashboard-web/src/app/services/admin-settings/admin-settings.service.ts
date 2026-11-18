import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IncidentSeverity } from '../../shared/models/incident-severity';
import { environment } from '../../../environments/environment';

export interface MapCenterSettings {
  latitude: number;
  longitude: number;
  zoom: number;
}

export interface MapZoneSettings {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
}

export interface AlertTypeSettings {
  id: string;
  name: string;
  severity: IncidentSeverity;
  enabled: boolean;
}

export interface AdminSettings {
  mapCenter: MapCenterSettings;
  zones: MapZoneSettings[];
  alertTypes: AlertTypeSettings[];
  updatedAt: string;
}

export interface AdminSettingsUpdate {
  mapCenter: MapCenterSettings;
  zones: Array<Omit<MapZoneSettings, 'id'>>;
  alertTypes: Array<Omit<AlertTypeSettings, 'id'>>;
}

const API_URL = `${environment.apiUrl}/admin/settings`;

@Injectable({ providedIn: 'root' })
export class AdminSettingsService {
  private readonly http = inject(HttpClient);

  getSettings() {
    return this.http.get<AdminSettings>(API_URL);
  }

  updateSettings(settings: AdminSettingsUpdate) {
    return this.http.patch<AdminSettings>(API_URL, settings);
  }
}
