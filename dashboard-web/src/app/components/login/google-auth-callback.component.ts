import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { APP_ROUTES } from '../../app.routes';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-google-auth-callback',
  standalone: true,
  imports: [TranslocoDirective],
  templateUrl: './google-auth-callback.component.html',
})
export class GoogleAuthCallbackComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    this.completeLoginFromRedirect();
  }

  private completeLoginFromRedirect(): void {
    const fragment = window.location.hash.slice(1);
    const accessToken = new URLSearchParams(fragment).get('access_token');
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search,
    );

    if (!accessToken) {
      this.returnToLogin();
      return;
    }

    this.authService.completeGoogleLogin(accessToken).subscribe({
      error: () => this.returnToLogin(),
    });
  }

  private returnToLogin(): void {
    void this.router.navigate([APP_ROUTES.login], {
      queryParams: { oauthError: 'google-login-failed' },
    });
  }
}
