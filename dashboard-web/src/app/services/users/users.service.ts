import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

export interface UserRow {
  id: string;
  username: string | null;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);

  listNonAdminUsers() {
    return this.http.get<UserRow[]>('http://localhost:3000/api/v1/users');
  }
}
