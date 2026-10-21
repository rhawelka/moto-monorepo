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
import Graphic from '@arcgis/core/Graphic.js';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js';
import Point from '@arcgis/core/geometry/Point.js';
import PopupTemplate from '@arcgis/core/PopupTemplate.js';
import MapView from '@arcgis/core/views/MapView.js';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { IncidentSeverity } from '../../shared/models/incident-severity';
import {
  Incident,
  IncidentsService,
} from '../../services/incidents/incidents.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [TranslocoDirective],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  readonly loadFailed = signal(false);
  readonly unmappedCount = signal(0);

  @ViewChild('mapContainer')
  private mapContainer?: ElementRef<HTMLDivElement>;
  private mapView?: MapView;
  private incidentLayer?: GraphicsLayer;
  private stylesheet?: HTMLLinkElement;
  private readonly incidentsService = inject(IncidentsService);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);
  private hasCenteredOnIncidents = false;
  private destroyed = false;

  ngAfterViewInit(): void {
    const mapContainer = this.mapContainer?.nativeElement;
    if (!mapContainer) {
      this.loadFailed.set(true);
      return;
    }

    esriConfig.assetsPath = new URL('assets', document.baseURI).href;

    this.stylesheet = document.createElement('link');
    this.stylesheet.rel = 'stylesheet';
    this.stylesheet.href = new URL(
      'assets/esri/themes/light/main.css',
      document.baseURI,
    ).href;
    this.stylesheet.onload = () => {
      if (this.destroyed) return;

      this.incidentLayer = new GraphicsLayer({ title: 'Incidents' });
      this.mapView = new MapView({
        container: mapContainer,
        map: new EsriMap({
          basemap: 'osm',
          layers: [this.incidentLayer],
        }),
        center: [19.94, 50.06],
        zoom: 11,
      });
      this.loadIncidents();
      this.incidentsService
        .watchUpdates()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event) => {
          if (event.type === 'updated') this.loadIncidents();
        });
    };
    this.stylesheet.onerror = () => {
      if (!this.destroyed) this.loadFailed.set(true);
    };
    document.head.append(this.stylesheet);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.mapView?.destroy();
    this.stylesheet?.remove();
  }

  private loadIncidents(): void {
    this.incidentsService
      .listAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (incidents) => {
          if (!this.incidentLayer) return;
          const locatedIncidents = incidents.filter(
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
          this.unmappedCount.set(incidents.length - locatedIncidents.length);
          const graphics = locatedIncidents.map(
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
                popupTemplate: new PopupTemplate({
                  title: '{title}',
                  content: [
                    { type: 'text', text: '{description}' },
                    {
                      type: 'fields',
                      fieldInfos: [
                        {
                          fieldName: 'location',
                          label: this.transloco.translate(
                            'incidents.mapLocation',
                          ),
                        },
                        {
                          fieldName: 'status',
                          label: this.transloco.translate(
                            'incidents.mapStatus',
                          ),
                        },
                        {
                          fieldName: 'severity',
                          label: this.transloco.translate(
                            'incidents.mapSeverity',
                          ),
                        },
                      ],
                    },
                  ],
                }),
              }),
          );

          this.incidentLayer.removeAll();
          this.incidentLayer.addMany(graphics);
          this.loadFailed.set(false);

          if (!this.hasCenteredOnIncidents && graphics.length > 0) {
            this.hasCenteredOnIncidents = true;
            void this.mapView?.goTo(graphics).catch((error: Error) => {
              if (error.name !== 'AbortError') this.loadFailed.set(true);
            });
          }
        },
        error: () => this.loadFailed.set(true),
      });
  }

  private severityColor(
    severity: IncidentSeverity,
  ): [number, number, number, number] {
    switch (severity) {
      case 'LOW':
        return [18, 183, 106, 1];
      case 'MEDIUM':
        return [45, 114, 232, 1];
      case 'HIGH':
        return [247, 144, 9, 1];
      case 'CRITICAL':
        return [217, 45, 32, 1];
    }
  }
}
