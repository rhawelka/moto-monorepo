import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { APP_ROUTES } from '../../app.routes';
import { AuthService } from '../../services/auth/auth.service';
import { GoogleAuthCallbackComponent } from './google-auth-callback.component';

describe('GoogleAuthCallbackComponent', () => {
  let fixture: ComponentFixture<GoogleAuthCallbackComponent>;
  let authService: { completeGoogleLogin: jest.Mock };
  let router: { navigate: jest.Mock };

  beforeEach(async () => {
    window.history.replaceState(null, '', '/');
    authService = {
      completeGoogleLogin: jest.fn().mockReturnValue(of({})),
    };
    router = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [
        GoogleAuthCallbackComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              authentication: {
                googleSigningIn: 'Signing in with Google...',
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
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(GoogleAuthCallbackComponent);
    fixture.detectChanges();
  }

  it('displays the Google sign-in progress message', () => {
    createComponent();

    expect(fixture.nativeElement.textContent).toContain(
      'Signing in with Google...',
    );
  });

  it('completes login with the access token from the URL fragment', () => {
    window.history.replaceState(
      null,
      '',
      '/auth/callback?source=google#access_token=google-token',
    );
    const replaceState = jest.spyOn(window.history, 'replaceState');

    createComponent();

    expect(authService.completeGoogleLogin).toHaveBeenCalledWith(
      'google-token',
    );
    expect(router.navigate).not.toHaveBeenCalled();
    expect(replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/auth/callback?source=google',
    );
    expect(window.location.hash).toBe('');
  });

  it.each([
    ['missing fragment', '/auth/callback'],
    ['missing access token', '/auth/callback#state=some-state'],
    ['empty access token', '/auth/callback#access_token='],
  ])('returns to login when the callback has a %s', (_description, url) => {
    window.history.replaceState(null, '', url);

    createComponent();

    expect(authService.completeGoogleLogin).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith([APP_ROUTES.login], {
      queryParams: { oauthError: 'google-login-failed' },
    });
    expect(window.location.hash).toBe('');
  });

  it('returns to login when completing Google login fails', () => {
    authService.completeGoogleLogin.mockReturnValue(
      throwError(() => new Error('Authentication failed')),
    );
    window.history.replaceState(
      null,
      '',
      '/auth/callback#access_token=invalid-token',
    );

    createComponent();

    expect(authService.completeGoogleLogin).toHaveBeenCalledWith(
      'invalid-token',
    );
    expect(router.navigate).toHaveBeenCalledWith([APP_ROUTES.login], {
      queryParams: { oauthError: 'google-login-failed' },
    });
  });
});
