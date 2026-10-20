import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  ViewContainerRef,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  Incident,
  IncidentQuery,
  IncidentSeverity,
  IncidentSortField,
  IncidentStatus,
  IncidentsService,
} from '../../services/incidents/incidents.service';
import { IncidentStatusDialogComponent } from './incident-status-dialog.component';

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, TranslocoDirective],
  templateUrl: './incidents.component.html',
  styleUrl: './incidents.component.scss',
})
export class IncidentsComponent {
  readonly incidents = signal<Incident[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly loading = signal(false);
  readonly loadFailed = signal(false);
  readonly liveConnected = signal(false);
  readonly syncFailed = signal(false);
  readonly sortBy = signal<IncidentSortField>('reportedAt');
  readonly order = signal<'asc' | 'desc'>('desc');
  readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize)),
  );
  readonly search = new FormControl('', { nonNullable: true });
  readonly status = new FormControl<IncidentStatus | ''>('', {
    nonNullable: true,
  });
  readonly severity = new FormControl<IncidentSeverity | ''>('', {
    nonNullable: true,
  });
  readonly statuses: IncidentStatus[] = [
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
  ];
  readonly severities: IncidentSeverity[] = [
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL',
  ];

  private readonly incidentsService = inject(IncidentsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalHost = viewChild('modalHost', {
    read: ViewContainerRef,
  });

  constructor() {
    this.search.valueChanges
    .pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    )
    .subscribe(() => this.resetAndLoad());
    this.status.valueChanges
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => this.resetAndLoad());
    this.severity.valueChanges
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => this.resetAndLoad());

    this.load();
    this.incidentsService
      .watchUpdates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.type === 'connected') {
          this.liveConnected.set(true);
          this.syncFailed.set(false);
        } else if (event.type === 'connection-error') {
          this.liveConnected.set(false);
          this.syncFailed.set(true);
        } else {
          this.load();
        }
      });
  }

  edit(incident: Incident): void {
    this.router.navigate(['/dashboard/incidents', incident.id, 'edit']);
  }

  openStatusDialog(incident: Incident, event: MouseEvent): void {
    event.stopPropagation();
    const modalHost = this.modalHost();
    if (!modalHost) throw new Error('Incident status modal host is unavailable.');

    modalHost.clear();
    const dialog = modalHost.createComponent(IncidentStatusDialogComponent);
    dialog.setInput('incident', incident);
    dialog.instance.closed.subscribe(() => {
      modalHost.clear();
    });
    dialog.instance.saved.subscribe(() => {
      modalHost.clear();
      this.load();
    });
  }

  setSort(field: IncidentSortField): void {
    if (this.sortBy() === field) {
      this.order.set(this.order() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.order.set(field === 'reportedAt' ? 'desc' : 'asc');
    }
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pageCount() || page === this.page()) return;
    this.page.set(page);
    this.load();
  }

  private resetAndLoad(): void {
    this.page.set(1);
    this.load();
  }

  private load(): void {
    const query: IncidentQuery = {
      page: this.page(),
      pageSize: this.pageSize,
      search: this.search.value,
      status: this.status.value,
      severity: this.severity.value,
      sortBy: this.sortBy(),
      order: this.order(),
    };

    this.loading.set(true);
    this.loadFailed.set(false);
    this.incidentsService
      .list(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.incidents.set(result.data);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => {
          this.loadFailed.set(true);
          this.loading.set(false);
        },
      });
  }
}
