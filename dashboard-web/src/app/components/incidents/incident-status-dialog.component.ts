import { Component, input, output, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  Incident,
  IncidentsService,
  IncidentStatus,
} from '../../services/incidents/incidents.service';

@Component({
  selector: 'app-incident-status-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, TranslocoDirective],
  template: `
    <ng-container *transloco="let t; prefix: 'incidents'">
      <div class="dialog-backdrop">
        <section
          class="dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="t('quickStatus')"
        >
          <h2>{{ t('quickStatus') }}</h2>
          <form (ngSubmit)="save()">
            <label for="quick-status">{{ t('status') }}</label>
            <select id="quick-status" [formControl]="status">
              @for (option of statuses; track option) {
                <option [value]="option">{{ t('status_' + option) }}</option>
              }
            </select>
            @if (errorMessage) {
              <p class="error" role="alert">{{ t('saveError') }}</p>
            }
            <div class="actions">
              <button type="button" class="secondary" (click)="closed.emit()">
                {{ t('cancel') }}
              </button>
              <button type="submit" [disabled]="status.invalid || saving">
                {{ saving ? t('saving') : t('save') }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </ng-container>
  `,
  styles: `
    :host { position: fixed; inset: 0; z-index: 1000; }
    .dialog-backdrop { display: grid; place-items: center; padding: 1rem; background: #06193088; }
    .dialog { width: min(100%, 28rem); padding: 1.5rem; border-radius: .75rem; background: var(--color-card-background); color: var(--color-page-text); box-shadow: 0 1rem 3rem #0003; }
    h2 { margin: 0 0 1.25rem; }
    form { display: grid; gap: .75rem; }
    select { min-height: 2.625rem; padding: .5rem; border: 1px solid var(--color-border); border-radius: .375rem; background: var(--color-card-background); color: var(--color-page-text); }
    .actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: .5rem; }
    button { min-height: 2.5rem; padding: .5rem .9rem; border: 0; border-radius: .375rem; background: var(--color-brand-blue); color: white; cursor: pointer; }
    button.secondary { background: transparent; color: var(--color-page-text); border: 1px solid var(--color-border); }
    button:disabled { opacity: .6; cursor: wait; }
    .error { margin: 0; color: var(--color-error); }
  `,
})
export class IncidentStatusDialogComponent implements OnInit {
  readonly incident = input.required<Incident>();
  readonly closed = output<void>();
  readonly saved = output<void>();
  readonly statuses: IncidentStatus[] = [
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
  ];
  readonly status = new FormControl<IncidentStatus>('OPEN', {
    nonNullable: true,
    validators: [Validators.required],
  });
  saving = false;
  errorMessage = false;

  private readonly incidentsService = inject(IncidentsService);

  ngOnInit(): void {
    this.status.setValue(this.incident().status);
  }

  save(): void {
    if (this.status.invalid || this.saving) return;
    this.saving = true;
    this.errorMessage = false;
    this.incidentsService
      .update(this.incident().id, { status: this.status.value })
      .subscribe({
        next: () => this.saved.emit(),
        error: () => {
          this.errorMessage = true;
          this.saving = false;
        },
      });
  }
}
