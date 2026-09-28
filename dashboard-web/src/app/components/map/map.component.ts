import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import EsriMap from '@arcgis/core/Map.js';
import esriConfig from '@arcgis/core/config.js';
import MapView from '@arcgis/core/views/MapView.js';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true })
  private mapContainer!: ElementRef<HTMLDivElement>;

  private mapView?: MapView;
  private stylesheet?: HTMLLinkElement;

  ngAfterViewInit(): void {
    esriConfig.assetsPath = new URL('assets', document.baseURI).href;

    this.stylesheet = document.createElement('link');
    this.stylesheet.rel = 'stylesheet';
    this.stylesheet.href = new URL(
      'assets/esri/themes/light/main.css',
      document.baseURI,
    ).href;
    this.stylesheet.onload = () => {
      this.mapView = new MapView({
        container: this.mapContainer.nativeElement,
        map: new EsriMap({ basemap: 'osm' }),
        center: [19.94, 50.06],
        zoom: 11,
      });
    };
    document.head.append(this.stylesheet);
  }

  ngOnDestroy(): void {
    this.mapView?.destroy();
    this.stylesheet?.remove();
  }
}
