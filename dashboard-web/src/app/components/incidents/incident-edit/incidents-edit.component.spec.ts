import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import {
  Incident,
  IncidentsService,
} from '../../../services/incidents/incidents.service';
import {
  LocationSearchService,
  LocationSuggestion,
} from '../../../services/incidents/location-search.service';
import { IncidentsEditComponent } from './incidents-edit.component';

describe('IncidentsEditComponent', () => {
  let fixture: ComponentFixture<IncidentsEditComponent>;
  let incidentsService: { get: jest.Mock; update: jest.Mock };
  let router: { navigate: jest.Mock };

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

  beforeEach(async () => {
    incidentsService = {
      get: jest.fn().mockReturnValue(of(incident)),
      update: jest.fn().mockReturnValue(of(incident)),
    };
    router = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [
        IncidentsEditComponent,
        TranslocoTestingModule.forRoot({
          langs: { en: { incidents: {} } },
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
        { provide: LocationSearchService, useValue: { search: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentsEditComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads the selected incident into the reactive form', () => {
    expect(incidentsService.get).toHaveBeenCalledWith(incident.id);
    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      title: incident.title,
      description: incident.description,
      location: incident.location,
      latitude: incident.latitude,
      longitude: incident.longitude,
      status: incident.status,
      severity: incident.severity,
    });
  });

  it('validates required text, non-whitespace values, and field length limits', () => {
    fixture.componentInstance.form.setValue({
      title: '    ',
      description: 'too short',
      location: ' ',
      latitude: 50.0614,
      longitude: 19.9366,
      status: 'OPEN',
      severity: 'MEDIUM',
    });

    expect(fixture.componentInstance.form.invalid).toBe(true);
    expect(fixture.componentInstance.form.controls.title.hasError('whitespace'))
      .toBe(true);
    expect(
      fixture.componentInstance.form.controls.description.hasError('minlength'),
    ).toBe(true);
    expect(
      fixture.componentInstance.form.controls.location.hasError('whitespace'),
    ).toBe(true);
  });

  it('submits valid changes and returns to the incident list', () => {
    fixture.componentInstance.form.setValue({
      title: 'Road hazard on King Street',
      description: 'A damaged traffic light is causing unsafe conditions.',
      location: 'King Street',
      latitude: 50.0614,
      longitude: 19.9366,
      status: 'IN_PROGRESS',
      severity: 'HIGH',
    });

    fixture.componentInstance.submit();

    expect(incidentsService.update).toHaveBeenCalledWith(incident.id, {
      title: 'Road hazard on King Street',
      description: 'A damaged traffic light is causing unsafe conditions.',
      location: 'King Street',
      latitude: 50.0614,
      longitude: 19.9366,
      status: 'IN_PROGRESS',
      severity: 'HIGH',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/incidents']);
  });

  it('updates the address and coordinates from a selected suggestion', () => {
    const suggestion: LocationSuggestion = {
      label: 'King Street, Krakow, Poland',
      latitude: 50.0614,
      longitude: 19.9366,
    };

    fixture.componentInstance.form.controls.location.setValue(
      suggestion.label,
      { emitEvent: false },
    );
    fixture.componentInstance.selectLocation(suggestion);

    expect(fixture.componentInstance.form.controls.location.value).toBe(
      suggestion.label,
    );
    expect(fixture.componentInstance.form.controls.latitude.value).toBe(
      suggestion.latitude,
    );
    expect(fixture.componentInstance.form.controls.longitude.value).toBe(
      suggestion.longitude,
    );
  });
});
