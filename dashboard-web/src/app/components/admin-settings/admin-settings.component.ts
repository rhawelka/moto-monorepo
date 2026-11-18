import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  IncidentSeverity,
  INCIDENT_SEVERITIES,
} from '../../shared/models/incident-severity';
import {
  AdminSettingsService,
  AlertTypeSettings,
  MapZoneSettings,
} from '../../services/admin-settings/admin-settings.service';

type ZoneControls = {
  name: FormControl<string>;
  latitude: FormControl<number>;
  longitude: FormControl<number>;
  radiusKm: FormControl<number>;
};

type AlertTypeControls = {
  name: FormControl<string>;
  severity: FormControl<IncidentSeverity>;
  enabled: FormControl<boolean>;
};

function uniqueNamesValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (!Array.isArray(control.value)) return null;

  const names = control.value
    .map((item: unknown) => {
      if (typeof item !== 'object' || item === null || !('name' in item)) {
        return null;
      }

      const { name } = item;
      return typeof name === 'string' ? name.trim().toLowerCase() : null;
    })
    .filter((name): name is string => name !== null && name.length > 0);

  return new Set(names).size === names.length ? null : { duplicateName: true };
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoDirective],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss',
})
export class AdminSettingsComponent {
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly saving = signal(false);
  readonly saveFailed = signal(false);
  readonly saved = signal(false);
  readonly severities = INCIDENT_SEVERITIES;
  readonly mapCenter = new FormGroup({
    latitude: new FormControl(50.0614, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(-90),
        Validators.max(90),
      ],
    }),
    longitude: new FormControl(19.9366, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(-180),
        Validators.max(180),
      ],
    }),
    zoom: new FormControl(11, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(20)],
    }),
  });
  readonly zones = new FormArray<FormGroup<ZoneControls>>(
    [],
    uniqueNamesValidator,
  );
  readonly alertTypes = new FormArray<FormGroup<AlertTypeControls>>(
    [],
    [Validators.minLength(1), uniqueNamesValidator],
  );
  readonly form = new FormGroup({
    mapCenter: this.mapCenter,
    zones: this.zones,
    alertTypes: this.alertTypes,
  });

  private readonly settingsService = inject(AdminSettingsService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.load();
  }

  addZone(): void {
    this.zones.push(this.createZoneForm());
    this.saved.set(false);
  }

  removeZone(index: number): void {
    this.zones.removeAt(index);
    this.saved.set(false);
  }

  addAlertType(): void {
    this.alertTypes.push(this.createAlertTypeForm());
    this.saved.set(false);
  }

  removeAlertType(index: number): void {
    this.alertTypes.removeAt(index);
    this.saved.set(false);
  }

  submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveFailed.set(false);
    this.saved.set(false);

    const formValue = this.form.getRawValue();
    this.settingsService
      .updateSettings({
        mapCenter: formValue.mapCenter,
        zones: formValue.zones,
        alertTypes: formValue.alertTypes,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (settings) => {
          this.setFormValues(
            settings.mapCenter,
            settings.zones,
            settings.alertTypes,
          );
          this.saving.set(false);
          this.saved.set(true);
        },
        error: () => {
          this.saving.set(false);
          this.saveFailed.set(true);
        },
      });
  }

  private load(): void {
    this.settingsService
      .getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (settings) => {
          this.setFormValues(
            settings.mapCenter,
            settings.zones,
            settings.alertTypes,
          );
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadFailed.set(true);
        },
      });
  }

  private setFormValues(
    mapCenter: { latitude: number; longitude: number; zoom: number },
    zones: MapZoneSettings[],
    alertTypes: AlertTypeSettings[],
  ): void {
    this.mapCenter.setValue(mapCenter);
    this.zones.clear();
    zones.forEach((zone) => this.zones.push(this.createZoneForm(zone)));
    this.alertTypes.clear();
    alertTypes.forEach((alertType) =>
      this.alertTypes.push(this.createAlertTypeForm(alertType)),
    );
    this.form.markAsPristine();
  }

  private createZoneForm(zone?: MapZoneSettings): FormGroup<ZoneControls> {
    return new FormGroup({
      name: new FormControl(zone?.name ?? '', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(80),
        ],
      }),
      latitude: new FormControl(zone?.latitude ?? 50.0614, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(-90),
          Validators.max(90),
        ],
      }),
      longitude: new FormControl(zone?.longitude ?? 19.9366, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(-180),
          Validators.max(180),
        ],
      }),
      radiusKm: new FormControl(zone?.radiusKm ?? 1, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(0.1),
          Validators.max(1000),
        ],
      }),
    });
  }

  private createAlertTypeForm(
    alertType?: AlertTypeSettings,
  ): FormGroup<AlertTypeControls> {
    return new FormGroup({
      name: new FormControl(alertType?.name ?? '', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/\S/),
          Validators.maxLength(80),
        ],
      }),
      severity: new FormControl<IncidentSeverity>(
        alertType?.severity ?? 'MEDIUM',
        { nonNullable: true, validators: [Validators.required] },
      ),
      enabled: new FormControl(alertType?.enabled ?? true, {
        nonNullable: true,
      }),
    });
  }
}
