import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserPermission } from '../../shared/models/user-permission';
import { environment } from '../../../environments/environment';

export interface UserRow {
  id: string;
  username: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  permissions: UserPermission[];
  createdAt: string;
}

export interface ManagedUserInput {
  username: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  permissions: UserPermission[];
  password?: string;
}

export type ManagedUserUpdate = Partial<Omit<ManagedUserInput, 'username'>> & {
  username?: string | null;
};

const API_URL = `${environment.apiUrl}/users`;

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<UserRow[]>(API_URL);
  }

  create(user: ManagedUserInput & { password: string }) {
    return this.http.post<UserRow>(API_URL, user);
  }

  update(id: string, changes: ManagedUserUpdate) {
    return this.http.patch<UserRow>(
      `${API_URL}/${encodeURIComponent(id)}`,
      changes,
    );
  }

  delete(id: string) {
    return this.http.delete<void>(`${API_URL}/${encodeURIComponent(id)}`);
  }
}
