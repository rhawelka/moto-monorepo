import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { User, AuthService } from './auth.service';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  const currentUser = signal<User | null>(null);

  beforeEach(() => {
    currentUser.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { currentUser },
        },
      ],
    });
  });

  const activate = () =>
    TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));

  it('allows an admin user', () => {
    currentUser.set({ id: 'admin-1', email: 'admin@test.pl', role: 'ADMIN' });

    expect(activate()).toBe(true);
  });

  it('redirects a regular user to the dashboard', () => {
    currentUser.set({ id: 'user-1', email: 'user@example.com', role: 'USER' });
    const result = activate();

    expect(result).not.toBe(true);
    expect(
      TestBed.inject(Router).serializeUrl(
        result as ReturnType<Router['createUrlTree']>,
      ),
    ).toBe('/dashboard');
  });

  it('redirects when there is no authenticated user', () => {
    const result = activate();

    expect(result).not.toBe(true);
    expect(
      TestBed.inject(Router).serializeUrl(
        result as ReturnType<Router['createUrlTree']>,
      ),
    ).toBe('/dashboard');
  });
});
