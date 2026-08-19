import { CreateUserDto, LoginDto } from '@moto-monorepo/dto';
import { Component, inject, signal } from '@angular/core';
import {
  form,
  FormField,
  required,
  email,
  submit,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormField],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
})
export class LoginComponent {
  private authService = inject(AuthService);

  isRegistering = signal(false);
  errorMessage = signal('');

  loginModel = signal<LoginDto>({
    email: '',
    password: '',
    rememberMe: false,
  });

  loginForm = form(this.loginModel, (fieldPath) => {
    required(fieldPath.email, { message: 'Email is required' });
    required(fieldPath.password, { message: 'Password is required' });
    email(fieldPath.email, { message: 'Enter a valid email address' });
  });

  registerModel = signal<CreateUserDto>({
    email: '',
    password: '',
  });

  registerForm = form(this.registerModel, (fieldPath) => {
    required(fieldPath.email, { message: 'Email is required' });
    required(fieldPath.password, { message: 'Password is required' });
    email(fieldPath.email, { message: 'Enter a valid email address' });
  });

  onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage.set('');

    const submitLogin = async () => {
      try {
        await firstValueFrom(this.authService.login(this.loginModel()));
      } catch {
        this.errorMessage.set('Login failed. Check your email and password.');
      }
    };

    const submitRegistration = async () => {
      try {
        await firstValueFrom(this.authService.register(this.registerModel()));
      } catch {
        this.errorMessage.set(
          'Registration failed. This email may already be registered.',
        );
      }
    };

    if (this.isRegistering()) {
      submit(this.registerForm, submitRegistration);
    } else {
      submit(this.loginForm, submitLogin);
    }
  }

  toggleMode() {
    this.errorMessage.set('');
    this.isRegistering.update((value) => !value);
  }
}
