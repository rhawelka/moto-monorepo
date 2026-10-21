import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { Incident, IncidentsService } from './incidents.service';

describe('IncidentsService', () => {
  let service: IncidentsService;
  let httpTestingController: HttpTestingController;

  const incident = (id: string): Incident => ({
    id,
    title: `Incident ${id}`,
    description: 'A reported event requiring response from the team.',
    location: 'Main Street, Krakow',
    latitude: 50.0614,
    longitude: 19.9366,
    status: 'OPEN',
    severity: 'MEDIUM',
    reportedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getToken: () => 'test-token' } },
      ],
    });
    service = TestBed.inject(IncidentsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('loads every page when fetching incidents for the map', (done) => {
    service.listAll().subscribe((incidents) => {
      expect(incidents).toHaveLength(101);
      expect(incidents[0].id).toBe('incident-1');
      expect(incidents[100].id).toBe('incident-101');
      done();
    });

    const firstPage = httpTestingController.expectOne(
      (request) =>
        request.url.endsWith('/incidents') &&
        request.params.get('page') === '1' &&
        request.params.get('pageSize') === '100',
    );
    firstPage.flush({
      data: Array.from({ length: 100 }, (_, index) =>
        incident(`incident-${index + 1}`),
      ),
      total: 101,
      page: 1,
      pageSize: 100,
    });

    const secondPage = httpTestingController.expectOne(
      (request) =>
        request.url.endsWith('/incidents') &&
        request.params.get('page') === '2',
    );
    secondPage.flush({
      data: [incident('incident-101')],
      total: 101,
      page: 2,
      pageSize: 100,
    });
  });
});
