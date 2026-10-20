import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  Incident,
  IncidentSeverity,
  IncidentStatus,
  IncidentsService,
} from '../../../services/incidents/incidents.service';

function hasNonWhitespace(control: AbstractControl<string>) {
  return control.value.trim().length > 0 ? null : { whitespace: true };
}

@Component({
  selector: 'app-incidents-edit',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslocoDirective],
  templateUrl: './incidents-edit.component.html',
  styleUrl: './incidents-edit.component.scss',
})
export class IncidentsEditComponent {
  readonly incident = signal<Incident | null>(null);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly saveFailed = signal(false);
  readonly saving = signal(false);
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

  readonly form = inject(FormBuilder).nonNullable.group({
    title: [
      '',
      [
        Validators.required,
        hasNonWhitespace,
        Validators.minLength(5),
        Validators.maxLength(120),
      ],
    ],
    description: [
      '',
      [
        Validators.required,
        hasNonWhitespace,
        Validators.minLength(20),
        Validators.maxLength(2000),
      ],
    ],
    location: [
      '',
      [
        Validators.required,
        hasNonWhitespace,
        Validators.minLength(2),
        Validators.maxLength(160),
      ],
    ],
    status: ['OPEN' as IncidentStatus, Validators.required],
    severity: ['MEDIUM' as IncidentSeverity, Validators.required],
  });

  private readonly incidentsService = inject(IncidentsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private incidentId = '';

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.incidentId = params.get('id') ?? '';
      this.load();
    });
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveFailed.set(false);
    this.incidentsService
      .update(this.incidentId, this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/dashboard/incidents']),
        error: () => {
          this.saveFailed.set(true);
          this.saving.set(false);
        },
      });
  }

  private load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.incidentsService
      .get(this.incidentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (incident) => {
          this.incident.set(incident);
          this.form.setValue({
            title: incident.title,
            description: incident.description,
            location: incident.location,
            status: incident.status,
            severity: incident.severity,
          });
          this.loading.set(false);
        },
        error: () => {
          this.loadFailed.set(true);
          this.loading.set(false);
        },
      });
  }
}
