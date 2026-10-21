import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  IncidentSeverity,
  IncidentStatus,
  IncidentsService,
} from '../../../services/incidents/incidents.service';

function hasNonWhitespace(control: AbstractControl<string>) {
  return control.value.trim().length > 0 ? null : { whitespace: true };
}

@Component({
  selector: 'app-incident-create',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslocoDirective],
  templateUrl: './incident-create.component.html',
  styleUrl: './incident-create.component.scss',
})
export class IncidentCreateComponent {
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
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveFailed.set(false);
    this.incidentsService
      .create(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.router.navigate(['/dashboard/incidents']),
        error: () => {
          this.saveFailed.set(true);
          this.saving.set(false);
        },
      });
  }
}
