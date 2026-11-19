import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { signal } from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import {
  Incident,
  IncidentsService,
} from '../../../services/incidents/incidents.service';
import { AuthService } from '../../../services/auth/auth.service';
import { IncidentDetailComponent } from './incident-detail.component';

describe('IncidentDetailComponent', () => {
  const incident: Incident = {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Road hazard near central station',
    description: 'Large debris is blocking one lane near the central station.',
    location: 'Central station',
    latitude: 50.0614,
    longitude: 19.9366,
    status: 'OPEN',
    severity: 'HIGH',
    reportedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  let fixture: ComponentFixture<IncidentDetailComponent>;
  let currentUser: ReturnType<typeof signal<{ role: 'USER' | 'ADMIN' } | null>>;
  let router: { navigate: jest.Mock };
  let incidentsService: {
    get: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    currentUser = signal({ role: 'ADMIN' as const });
    router = { navigate: jest.fn() };
    incidentsService = {
      get: jest.fn().mockReturnValue(of(incident)),
      delete: jest.fn().mockReturnValue(of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [
        IncidentDetailComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              incidents: {
                details: 'Incident details',
                delete: 'Delete',
                confirmDeleteTitle: 'Delete incident?',
                confirmDeleteDescription: 'This action cannot be undone.',
                confirmDelete: 'Delete incident',
                deleting: 'Deleting',
                deleteError: 'Delete failed',
                loadError: 'Load failed',
                backToList: 'Back to incidents',
                edit: 'Edit',
                description: 'Description',
                location: 'Location',
                status: 'Status',
                severity: 'Severity',
                reportedAt: 'Reported',
                updatedAt: 'Last updated',
                coordinates: 'Coordinates',
                status_OPEN: 'Open',
                severity_HIGH: 'High',
                cancel: 'Cancel',
              },
            },
          },
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: incident.id })),
          },
        },
        { provide: Router, useValue: router },
        { provide: IncidentsService, useValue: incidentsService },
        { provide: AuthService, useValue: { currentUser } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads and displays incident details', () => {
    expect(incidentsService.get).toHaveBeenCalledWith(incident.id);
    expect(fixture.componentInstance.incident()).toEqual(incident);
    expect(fixture.nativeElement.textContent).toContain(incident.description);
    expect(fixture.nativeElement.textContent).toContain(incident.location);
  });

  it('shows delete confirmation and deletes for an administrator', () => {
    fixture.componentInstance.requestDelete();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.delete-confirmation'),
    ).not.toBeNull();

    fixture.componentInstance.confirmDelete();

    expect(incidentsService.delete).toHaveBeenCalledWith(incident.id);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/incidents']);
  });

  it('does not expose delete controls to non-admin users', () => {
    currentUser.set({ role: 'USER' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.delete-action')).toBeNull();
    fixture.componentInstance.requestDelete();
    fixture.componentInstance.confirmDelete();
    expect(incidentsService.delete).not.toHaveBeenCalled();
  });

  it('keeps the page and reports an error if deletion fails', () => {
    incidentsService.delete.mockReturnValue(
      throwError(() => new Error('API unavailable')),
    );
    fixture.componentInstance.requestDelete();
    fixture.componentInstance.confirmDelete();
    fixture.detectChanges();

    expect(fixture.componentInstance.deleteFailed()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Delete failed');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
