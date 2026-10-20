import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import {
  Incident,
  IncidentsService,
} from '../../../services/incidents/incidents.service';
import { IncidentStatusDialogComponent } from '../incident-status-dialog/incident-status-dialog.component';
import { IncidentsComponent } from './incidents.component';

describe('IncidentsComponent', () => {
  let fixture: ComponentFixture<IncidentsComponent>;
  let incidentsService: {
    list: jest.Mock;
    watchUpdates: jest.Mock;
    update: jest.Mock;
  };

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
      list: jest.fn().mockReturnValue(
        of({ data: [incident], total: 1, page: 1, pageSize: 10 }),
      ),
      watchUpdates: jest.fn().mockReturnValue(of({ type: 'connected' })),
      update: jest.fn().mockReturnValue(of({ ...incident, status: 'RESOLVED' })),
    };

    await TestBed.configureTestingModule({
      imports: [
        IncidentsComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: { incidents: {} } },
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [
        { provide: IncidentsService, useValue: incidentsService },
        { provide: Router, useValue: { navigate: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads the paginated incident list and opens the dynamic status dialog', () => {
    expect(incidentsService.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 10 }),
    );

    fixture.componentInstance.openStatusDialog(
      incident,
      new MouseEvent('click'),
    );
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.directive(IncidentStatusDialogComponent)),
    ).not.toBeNull();
  });

  it('saves the status selected in the dynamically created dialog', () => {
    fixture.componentInstance.openStatusDialog(
      incident,
      new MouseEvent('click'),
    );
    fixture.detectChanges();

    const dialog = fixture.debugElement.query(
      By.directive(IncidentStatusDialogComponent),
    ).componentInstance as IncidentStatusDialogComponent;
    dialog.status.setValue('RESOLVED');
    dialog.save();
    fixture.detectChanges();

    expect(incidentsService.update).toHaveBeenCalledWith(incident.id, {
      status: 'RESOLVED',
    });
    expect(incidentsService.list).toHaveBeenCalledTimes(2);
  });
});
