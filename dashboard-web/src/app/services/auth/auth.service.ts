import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { APP_ROUTES } from '../../app.routes';

// todo move interfaces to a separate file
export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

// todo move interfaces to a separate file
export interface AuthResponse {
  user: User;
  access_token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(this.getUserFromStorage());
  isAuthenticated = computed(() => !!this.currentUser());

  private http = inject(HttpClient);
  private router = inject(Router);

  //todo move localhost URL to environment variable or config file for better flexibility and security
  private readonly API_URL = 'http://localhost:3000/api/v1/auth';

  register(credentials: { username: string; email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, credentials)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  login(credentials: { email: string; password: string }) {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  startGoogleLogin(): void {
    window.location.assign(`${this.API_URL}/google`);
  }

  completeGoogleLogin(accessToken: string) {
    return this.http
      .get<User>(`${this.API_URL}/profile`, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${accessToken}`,
        }),
      })
      .pipe(
        tap((user) =>
          this.handleAuthSuccess({ user, access_token: accessToken }),
        ),
      );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate([APP_ROUTES.login]);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private handleAuthSuccess(res: AuthResponse) {
    localStorage.setItem('access_token', res.access_token);
    localStorage.setItem('user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
    this.router.navigate([APP_ROUTES.dashboard.root]);
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
}
