import { Component } from '@angular/core';
import { MapComponent } from '../map/map.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [MapComponent],
  styleUrl: './overview.component.scss',
  template: `
    <section class="overview">
      <h2>Overview</h2>
      <app-map />
    </section>
  `,
})
export class OverviewComponent {}
