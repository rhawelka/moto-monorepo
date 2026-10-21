import {
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  DEFAULT_INCIDENT_STATUS,
  INCIDENT_STATUSES,
  IncidentStatus,
} from '../../../shared/models/incident-status';
import {
  Incident,
  IncidentsService,
} from '../../../services/incidents/incidents.service';

@Component({
  selector: 'app-incident-status-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoDirective],
  templateUrl: './incident-status-dialog.component.html',
  styleUrl: './incident-status-dialog.component.scss',
})
export class IncidentStatusDialogComponent implements OnInit {
  readonly incident = input.required<Incident>();
  readonly closed = output<void>();
  readonly saved = output<void>();
  readonly statuses = INCIDENT_STATUSES;
  readonly status = new FormControl<IncidentStatus>(DEFAULT_INCIDENT_STATUS, {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly saving = signal(false);
  readonly errorMessage = signal(false);

  private readonly incidentsService = inject(IncidentsService);

  ngOnInit(): void {
    this.status.setValue(this.incident().status);
  }

  save(): void {
    if (this.status.invalid || this.saving()) return;
    this.saving.set(true);
    this.errorMessage.set(false);
    this.incidentsService
      .update(this.incident().id, { status: this.status.value })
      .subscribe({
        next: () => this.saved.emit(),
        error: () => {
          this.errorMessage.set(true);
          this.saving.set(false);
        },
      });
  }
}
