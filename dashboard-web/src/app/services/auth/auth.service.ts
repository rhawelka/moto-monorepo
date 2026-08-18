import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = 'http://localhost:3000/api/auth';

  // State management using Signals
  currentUser = signal<User | null>(this.getUserFromStorage());
  isAuthenticated = computed(() => !!this.currentUser());

  register(credentials: { email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, credentials)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  login(credentials: { email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private handleAuthSuccess(res: AuthResponse) {
    localStorage.setItem('access_token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
    this.router.navigate(['/dashboard']);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
}
