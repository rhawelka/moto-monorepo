import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password === confirmPassword ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
    TranslocoDirective,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  standalone: true,
})
export class RegisterComponent {
  errorMessage = signal('');
  passwordVisible = signal(false);
  confirmPasswordVisible = signal(false);
  registerForm!: FormGroup<{
    username: FormControl<string>;
    email: FormControl<string>;
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
  }>;

  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);
  private transloco = inject(TranslocoService);

  constructor() {
    this.registerForm = this.formBuilder.nonNullable.group(
      {
        username: ['', [Validators.required, Validators.pattern(/\S/)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: passwordsMatch },
    );
  }

  onRegisterSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage.set('');

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { username, email, password } = this.registerForm.getRawValue();
    firstValueFrom(
      this.authService.register({ username: username.trim(), email, password }),
    )
      .then(() => {
        console.log(`Mock email will be sent to ${email}`);
      })
      .catch(() => {
        this.errorMessage.set(
          this.transloco.translate('authentication.registrationFailed'),
        );
      });
  }

  onClickRevealPassword(event: MouseEvent): void {
    event.preventDefault();
    this.passwordVisible.update((visible) => !visible);
  }

  onClickRevealConfirmPassword(event: MouseEvent): void {
    event.preventDefault();
    this.confirmPasswordVisible.update((visible) => !visible);
  }
}
