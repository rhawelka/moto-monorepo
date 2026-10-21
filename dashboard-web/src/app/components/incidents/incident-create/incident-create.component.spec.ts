import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { Incident, IncidentsService } from '../../../services/incidents/incidents.service';
import { IncidentCreateComponent } from './incident-create.component';

describe('IncidentCreateComponent', () => {
  let fixture: ComponentFixture<IncidentCreateComponent>;
  let incidentsService: { create: jest.Mock };
  let router: { navigate: jest.Mock };

  const createdIncident: Incident = {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Road hazard near central station',
    description: 'Large debris is blocking one lane near the central station.',
    location: 'Central station',
    status: 'OPEN',
    severity: 'MEDIUM',
    reportedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    incidentsService = {
      create: jest.fn().mockReturnValue(of(createdIncident)),
    };
    router = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [
        IncidentCreateComponent,
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
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentCreateComponent);
    fixture.detectChanges();
  });

  it('does not submit an invalid form', () => {
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.form.touched).toBe(true);
    expect(incidentsService.create).not.toHaveBeenCalled();
  });

  it('creates a valid incident and navigates back to the list', () => {
    fixture.componentInstance.form.setValue({
      title: 'Road hazard near central station',
      description: 'Large debris is blocking one lane near the central station.',
      location: 'Central station',
      status: 'OPEN',
      severity: 'HIGH',
    });

    fixture.componentInstance.submit();

    expect(incidentsService.create).toHaveBeenCalledWith({
      title: 'Road hazard near central station',
      description: 'Large debris is blocking one lane near the central station.',
      location: 'Central station',
      status: 'OPEN',
      severity: 'HIGH',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/incidents']);
  });

  it('shows an error and allows retry when the API rejects the creation', () => {
    incidentsService.create.mockReturnValueOnce(
      throwError(() => new Error('API unavailable')),
    );
    fixture.componentInstance.form.setValue({
      title: 'Road hazard near central station',
      description: 'Large debris is blocking one lane near the central station.',
      location: 'Central station',
      status: 'OPEN',
      severity: 'HIGH',
    });

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.componentInstance.saveFailed()).toBe(true);
    expect(fixture.componentInstance.saving()).toBe(false);
  });
});
