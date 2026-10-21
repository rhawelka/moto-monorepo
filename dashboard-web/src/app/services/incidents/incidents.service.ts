import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EMPTY, Observable, expand, reduce } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../auth/auth.service';

export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentSortField = 'title' | 'status' | 'severity' | 'reportedAt';

export interface Incident {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  reportedAt: string;
  updatedAt: string;
}

export interface IncidentPage {
  data: Incident[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IncidentQuery {
  page: number;
  pageSize: number;
  search: string;
  status: IncidentStatus | '';
  severity: IncidentSeverity | '';
  sortBy: IncidentSortField;
  order: 'asc' | 'desc';
}

export type IncidentUpdateEvent =
  | { type: 'connected' }
  | { type: 'updated'; incident: Incident }
  | { type: 'connection-error'; message: string };

const API_URL = 'http://localhost:3000/api/v1/incidents';
const SOCKET_URL = 'http://localhost:3000/incidents';

@Injectable({ providedIn: 'root' })
export class IncidentsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  list(query: IncidentQuery): Observable<IncidentPage> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('order', query.order);

    if (query.search.trim()) params = params.set('search', query.search.trim());
    if (query.status) params = params.set('status', query.status);
    if (query.severity) params = params.set('severity', query.severity);

    return this.http.get<IncidentPage>(API_URL, { params });
  }

  listAll(): Observable<Incident[]> {
    const query: IncidentQuery = {
      page: 1,
      pageSize: 100,
      search: '',
      status: '',
      severity: '',
      sortBy: 'reportedAt',
      order: 'desc',
    };

    return this.list(query).pipe(
      expand((result) =>
        result.page * result.pageSize < result.total
          ? this.list({ ...query, page: result.page + 1 })
          : EMPTY,
      ),
      reduce(
        (incidents, result) => incidents.concat(result.data),
        [] as Incident[],
      ),
    );
  }

  get(id: string): Observable<Incident> {
    return this.http.get<Incident>(`${API_URL}/${encodeURIComponent(id)}`);
  }

  update(
    id: string,
    changes: Partial<
      Pick<
        Incident,
        | 'title'
        | 'description'
        | 'location'
        | 'latitude'
        | 'longitude'
        | 'status'
        | 'severity'
      >
    >,
  ): Observable<Incident> {
    return this.http.patch<Incident>(
      `${API_URL}/${encodeURIComponent(id)}`,
      changes,
    );
  }

  create(
    incident: Pick<
      Incident,
      | 'title'
      | 'description'
      | 'location'
      | 'latitude'
      | 'longitude'
      | 'status'
      | 'severity'
    >,
  ): Observable<Incident> {
    return this.http.post<Incident>(API_URL, incident);
  }

  watchUpdates(): Observable<IncidentUpdateEvent> {
    return new Observable((subscriber) => {
      const token = this.authService.getToken();
      if (!token) {
        subscriber.next({
          type: 'connection-error',
          message: 'Authentication token is unavailable.',
        });
        subscriber.complete();
        return;
      }

      const socket: Socket = io(SOCKET_URL, {
        auth: { token },
      });
      socket.on('connect', () => subscriber.next({ type: 'connected' }));
      socket.on('incident.updated', (incident: Incident) =>
        subscriber.next({ type: 'updated', incident }),
      );
      socket.on('connect_error', (error: Error) =>
        subscriber.next({ type: 'connection-error', message: error.message }),
      );
      socket.on('disconnect', (reason: string) =>
        subscriber.next({ type: 'connection-error', message: reason }),
      );

      return () => socket.disconnect();
    });
  }
}
