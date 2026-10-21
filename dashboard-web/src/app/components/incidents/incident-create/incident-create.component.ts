import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { INCIDENT_SEVERITIES } from '../../../shared/models/incident-severity';
import {
  DEFAULT_INCIDENT_STATUS,
  INCIDENT_STATUSES,
} from '../../../shared/models/incident-status';
import { IncidentsService } from '../../../services/incidents/incidents.service';
import { LocationSuggestion } from '../../../services/incidents/location-search.service';
import { LocationAutocompleteComponent } from '../location-autocomplete/location-autocomplete.component';

function hasNonWhitespace(control: AbstractControl<string>) {
  return control.value.trim().length > 0 ? null : { whitespace: true };
}

@Component({
  selector: 'app-incident-create',
  standalone: true,
  imports: [
    LocationAutocompleteComponent,
    ReactiveFormsModule,
    RouterLink,
    TranslocoDirective,
  ],
  templateUrl: './incident-create.component.html',
  styleUrl: './incident-create.component.scss',
})
export class IncidentCreateComponent {
  readonly saveFailed = signal(false);
  readonly saving = signal(false);
  readonly statuses = INCIDENT_STATUSES;
  readonly severities = INCIDENT_SEVERITIES;

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
    latitude: [null as number | null, Validators.required],
    longitude: [null as number | null, Validators.required],
    status: [DEFAULT_INCIDENT_STATUS, Validators.required],
    severity: [INCIDENT_SEVERITIES[0], Validators.required],
  });

  private readonly incidentsService = inject(IncidentsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  clearLocationCoordinates(): void {
    this.form.controls.latitude.setValue(null);
    this.form.controls.longitude.setValue(null);
  }

  selectLocation(location: LocationSuggestion): void {
    this.form.controls.latitude.setValue(location.latitude);
    this.form.controls.longitude.setValue(location.longitude);
  }

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
