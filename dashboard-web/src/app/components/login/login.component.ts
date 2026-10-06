import { Component, inject, signal } from '@angular/core';
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
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

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
export class LoginComponent {
  errorMessage = signal('');
  passwordVisible = signal(false);
  loginForm!: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;

  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);
  private transloco = inject(TranslocoService);

  constructor() {
    this.loginForm = this.formBuilder.nonNullable.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
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
}
