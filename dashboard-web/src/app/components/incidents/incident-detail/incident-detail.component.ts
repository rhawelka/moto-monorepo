import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { APP_ROUTES } from '../../../app.routes';
import { AuthService } from '../../../services/auth/auth.service';
import { hasPermission } from '../../../services/auth/permission.guard';
import {
  Incident,
  IncidentsService,
} from '../../../services/incidents/incidents.service';

@Component({
  selector: 'app-incident-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, TranslocoDirective],
  templateUrl: './incident-detail.component.html',
  styleUrl: './incident-detail.component.scss',
})
export class IncidentDetailComponent {
  readonly incident = signal<Incident | null>(null);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly deleteConfirmationVisible = signal(false);
  readonly deleting = signal(false);
  readonly deleteFailed = signal(false);
  readonly canUpdate = computed(() =>
    hasPermission(this.authService.currentUser(), 'INCIDENTS_UPDATE'),
  );
  readonly canDelete = computed(() =>
    hasPermission(this.authService.currentUser(), 'INCIDENTS_DELETE'),
  );
  readonly APP_ROUTES = APP_ROUTES;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly incidentsService = inject(IncidentsService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.load(params.get('id') ?? ''));
  }

  requestDelete(): void {
    this.deleteConfirmationVisible.set(true);
    this.deleteFailed.set(false);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.deleteConfirmationVisible.set(false);
  }

  confirmDelete(): void {
    const incident = this.incident();
    if (!incident || !this.canDelete() || this.deleting()) return;

    this.deleting.set(true);
    this.deleteFailed.set(false);
    this.incidentsService
      .delete(incident.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate([APP_ROUTES.dashboard.incidents.list]),
        error: () => {
          this.deleting.set(false);
          this.deleteFailed.set(true);
        },
      });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.incidentsService
      .get(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (incident) => {
          this.incident.set(incident);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadFailed.set(true);
        },
      });
  }
}
