import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import EsriMap from '@arcgis/core/Map.js';
import esriConfig from '@arcgis/core/config.js';
import Circle from '@arcgis/core/geometry/Circle.js';
import Graphic from '@arcgis/core/Graphic.js';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js';
import Point from '@arcgis/core/geometry/Point.js';
import PopupTemplate from '@arcgis/core/PopupTemplate.js';
import MapView from '@arcgis/core/views/MapView.js';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { IncidentSeverity } from '../../shared/models/incident-severity';
import {
  AdminSettingsService,
  MapZoneSettings,
} from '../../services/admin-settings/admin-settings.service';
import {
  Incident,
  IncidentsService,
} from '../../services/incidents/incidents.service';

type RgbaColor = [number, number, number, number];

const INCIDENT_SEVERITY_COLORS: Record<IncidentSeverity, RgbaColor> = {
  LOW: [18, 183, 106, 1],
  MEDIUM: [45, 114, 232, 1],
  HIGH: [247, 144, 9, 1],
  CRITICAL: [217, 45, 32, 1],
};

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [TranslocoDirective],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  readonly loadFailed = signal(false);
  readonly settingsLoadFailed = signal(false);
  readonly unmappedCount = signal(0);

  @ViewChild('mapContainer')
  private mapContainer?: ElementRef<HTMLDivElement>;
  private mapView?: MapView;
  private incidentLayer?: GraphicsLayer;
  private zoneLayer?: GraphicsLayer;
  private stylesheet?: HTMLLinkElement;
  private readonly incidentsService = inject(IncidentsService);
  private readonly adminSettingsService = inject(AdminSettingsService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private hasCenteredOnIncidents = false;
  private destroyed = false;

  ngAfterViewInit(): void {
    const mapContainer = this.getMapContainer();
    if (!mapContainer) return;

    this.configureArcGisAssets();
    this.loadArcGisStylesheet(mapContainer);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.mapView?.destroy();
    this.stylesheet?.remove();
  }

  private getMapContainer(): HTMLDivElement | null {
    const mapContainer = this.mapContainer?.nativeElement;
    if (!mapContainer) this.loadFailed.set(true);
    return mapContainer ?? null;
  }

  private configureArcGisAssets(): void {
    esriConfig.assetsPath = new URL('assets', document.baseURI).href;
  }

  private loadArcGisStylesheet(mapContainer: HTMLDivElement): void {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL(
      'assets/esri/themes/light/main.css',
      document.baseURI,
    ).href;
    stylesheet.onload = () => this.initializeMap(mapContainer);
    stylesheet.onerror = () => this.handleStylesheetLoadError();

    this.stylesheet = stylesheet;
    document.head.append(stylesheet);
  }

  private initializeMap(mapContainer: HTMLDivElement): void {
    if (this.destroyed) return;

    this.createMapView(mapContainer);
    this.loadAdminSettings();
    this.loadIncidents();
    this.subscribeToIncidentUpdates();
  }

  private loadAdminSettings(): void {
    this.adminSettingsService
      .getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (settings) => {
          this.settingsLoadFailed.set(false);
          this.renderMapZones(settings.zones);
          if (
            !this.hasCenteredOnIncidents &&
            this.incidentLayer?.graphics.length === 0
          ) {
            void this.mapView
              ?.goTo({
                center: [
                  settings.mapCenter.longitude,
                  settings.mapCenter.latitude,
                ],
                zoom: settings.mapCenter.zoom,
              })
              .catch((error: Error) => {
                if (error.name !== 'AbortError') this.loadFailed.set(true);
              });
          }
        },
        error: () => this.settingsLoadFailed.set(true),
      });
  }

  private createMapView(mapContainer: HTMLDivElement): void {
    this.incidentLayer = new GraphicsLayer({ title: 'Incidents' });
    this.zoneLayer = new GraphicsLayer({ title: 'Configured zones' });
    this.mapView = new MapView({
      container: mapContainer,
      map: new EsriMap({
        basemap: 'osm',
        layers: [this.zoneLayer, this.incidentLayer],
      }),
      center: [19.94, 50.06],
      zoom: 11,
    });
  }

  private subscribeToIncidentUpdates(): void {
    this.incidentsService
      .watchUpdates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.type === 'updated' || event.type === 'deleted') {
          this.loadIncidents();
        }
      });
  }

  private handleStylesheetLoadError(): void {
    if (!this.destroyed) this.loadFailed.set(true);
  }

  private loadIncidents(): void {
    this.incidentsService
      .listAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (incidents) => this.handleIncidentLoadSuccess(incidents),
        error: () => this.loadFailed.set(true),
      });
  }

  private handleIncidentLoadSuccess(incidents: Incident[]): void {
    if (!this.incidentLayer) return;

    const locatedIncidents = this.filterLocatedIncidents(incidents);
    this.unmappedCount.set(incidents.length - locatedIncidents.length);

    const graphics = this.createIncidentGraphics(locatedIncidents);
    this.renderIncidentGraphics(graphics);
    this.centerMapOnIncidents(graphics);
    this.loadFailed.set(false);
  }

  private filterLocatedIncidents(
    incidents: Incident[],
  ): Array<Incident & { latitude: number; longitude: number }> {
    return incidents.filter(
      (
        incident,
      ): incident is Incident & {
        latitude: number;
        longitude: number;
      } =>
        incident.latitude !== null &&
        incident.longitude !== null &&
        Number.isFinite(incident.latitude) &&
        Number.isFinite(incident.longitude),
    );
  }

  private createIncidentGraphics(
    incidents: Array<Incident & { latitude: number; longitude: number }>,
  ): Graphic[] {
    return incidents.map(
      (incident) =>
        new Graphic({
          geometry: new Point({
            latitude: incident.latitude,
            longitude: incident.longitude,
          }),
          attributes: {
            title: incident.title,
            description: incident.description,
            location: incident.location,
            status: incident.status,
            severity: incident.severity,
          },
          symbol: {
            type: 'simple-marker',
            style: 'circle',
            color: this.severityColor(incident.severity),
            size: '12px',
            outline: { color: '#ffffff', width: 1.5 },
          },
          popupTemplate: this.createPopupTemplate(),
        }),
    );
  }

  private createPopupTemplate(): PopupTemplate {
    return new PopupTemplate({
      title: '{title}',
      content: [
        { type: 'text', text: '{description}' },
        {
          type: 'fields',
          fieldInfos: [
            {
              fieldName: 'location',
              label: this.transloco.translate('incidents.mapLocation'),
            },
            {
              fieldName: 'status',
              label: this.transloco.translate('incidents.mapStatus'),
            },
            {
              fieldName: 'severity',
              label: this.transloco.translate('incidents.mapSeverity'),
            },
          ],
        },
      ],
    });
  }

  private renderIncidentGraphics(graphics: Graphic[]): void {
    if (!this.incidentLayer) return;

    this.incidentLayer.removeAll();
    this.incidentLayer.addMany(graphics);
  }

  private renderMapZones(zones: MapZoneSettings[]): void {
    if (!this.zoneLayer) return;

    this.zoneLayer.removeAll();
    this.zoneLayer.addMany(
      zones.map(
        (zone) =>
          new Graphic({
            geometry: new Circle({
              center: new Point({
                latitude: zone.latitude,
                longitude: zone.longitude,
              }),
              radius: zone.radiusKm,
              radiusUnit: 'kilometers',
            }),
            attributes: { name: zone.name, radiusKm: zone.radiusKm },
            symbol: {
              type: 'simple-fill',
              color: [45, 114, 232, 0.12],
              outline: { color: [45, 114, 232, 0.8], width: 1.5 },
            },
            popupTemplate: new PopupTemplate({
              title: '{name}',
              content: `${this.transloco.translate('incidents.zoneRadius')}: {radiusKm} km`,
            }),
          }),
      ),
    );
  }

  private centerMapOnIncidents(graphics: Graphic[]): void {
    if (this.hasCenteredOnIncidents || graphics.length === 0) return;

    this.hasCenteredOnIncidents = true;
    void this.mapView?.goTo(graphics).catch((error: Error) => {
      if (error.name !== 'AbortError') this.loadFailed.set(true);
    });
  }

  private severityColor(severity: IncidentSeverity): RgbaColor {
    return INCIDENT_SEVERITY_COLORS[severity];
  }
}
