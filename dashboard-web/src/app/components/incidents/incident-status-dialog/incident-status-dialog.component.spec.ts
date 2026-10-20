import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import {
  Incident,
  IncidentsService,
} from '../../../services/incidents/incidents.service';
import { IncidentStatusDialogComponent } from './incident-status-dialog.component';

describe('IncidentStatusDialogComponent', () => {
  let fixture: ComponentFixture<IncidentStatusDialogComponent>;
  let incidentsService: { update: jest.Mock };

  const incident: Incident = {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Road hazard near central station',
    description: 'Large debris is blocking one lane near the central station.',
    location: 'Central station',
    status: 'OPEN',
    severity: 'HIGH',
    reportedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    incidentsService = {
      update: jest.fn().mockReturnValue(of(incident)),
    };

    await TestBed.configureTestingModule({
      imports: [
        IncidentStatusDialogComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              incidents: {
                quickStatus: 'Change status',
                status: 'Status',
                status_OPEN: 'Open',
                status_IN_PROGRESS: 'In progress',
                status_RESOLVED: 'Resolved',
                status_CLOSED: 'Closed',
                saveError: 'Could not save changes.',
                cancel: 'Cancel',
                save: 'Save',
                saving: 'Saving',
              },
            },
          },
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [{ provide: IncidentsService, useValue: incidentsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentStatusDialogComponent);
    fixture.componentRef.setInput('incident', incident);
    fixture.detectChanges();
  });

  it('initializes the form with the incident current status', () => {
    expect(fixture.componentInstance.status.value).toBe('OPEN');
  });

  it('submits the selected status and emits saved after success', () => {
    const saved = jest.fn();
    fixture.componentInstance.saved.subscribe(saved);
    fixture.componentInstance.status.setValue('RESOLVED');

    fixture.componentInstance.save();

    expect(incidentsService.update).toHaveBeenCalledWith(incident.id, {
      status: 'RESOLVED',
    });
    expect(saved).toHaveBeenCalledTimes(1);
  });

  it('does not submit an invalid status', () => {
    fixture.componentInstance.status.setValue('' as Incident['status']);

    fixture.componentInstance.save();

    expect(incidentsService.update).not.toHaveBeenCalled();
  });

  it('displays an error when saving fails', () => {
    incidentsService.update.mockReturnValueOnce(
      throwError(() => new Error('Network unavailable')),
    );

    fixture.componentInstance.save();
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).toBe(true);
    expect(fixture.componentInstance.saving()).toBe(false);
    expect(fixture.debugElement.query(By.css('[role="alert"]'))).not.toBeNull();
  });

  it('emits closed when the cancel button is clicked', () => {
    const closed = jest.fn();
    fixture.componentInstance.closed.subscribe(closed);

    const cancelButton = fixture.debugElement.query(
      By.css('button.secondary'),
    );
    cancelButton.triggerEventHandler('click');

    expect(closed).toHaveBeenCalledTimes(1);
  });
});
