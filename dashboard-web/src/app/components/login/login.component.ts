import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { APP_ROUTES } from '../../app.routes';

@Component({
  selector: 'app-login',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
    MatIconModule,
    TranslocoDirective,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
})
export class LoginComponent implements OnInit {
  readonly APP_ROUTES = APP_ROUTES;
  errorMessage = signal('');
  passwordVisible = signal(false);
  loginForm!: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);
  private transloco = inject(TranslocoService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.initializeLoginForm();
    this.setOAuthErrorMessage();
  }

  onGoogleLogin(): void {
    this.authService.startGoogleLogin();
  }

  onLoginSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    firstValueFrom(this.authService.login(this.loginForm.getRawValue())).catch(
      () =>
        this.errorMessage.set(
          this.transloco.translate('authentication.loginFailed'),
        ),
    );
  }

  onClickRevealPassword(event: MouseEvent) {
    event.preventDefault();
    this.passwordVisible.update((visible) => !visible);
  }

  private initializeLoginForm(): void {
    this.loginForm = this.formBuilder.nonNullable.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  private setOAuthErrorMessage(): void {
    const oauthError = this.route.snapshot.queryParamMap.get('oauthError');
    if (oauthError === 'google-account-not-found') {
      this.errorMessage.set(
        this.transloco.translate('authentication.googleAccountNotFound'),
      );
    } else if (oauthError === 'google-login-failed') {
      this.errorMessage.set(
        this.transloco.translate('authentication.googleLoginFailed'),
      );
    }
  }
}
