import { LoginDto } from '@moto-monorepo/dto';
import { Component, signal } from '@angular/core';
import {
  form,
  FormField,
  required,
  email,
  submit,
} from '@angular/forms/signals';

@Component({
  selector: 'app-login',
  imports: [FormField],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  standalone: true,
})
export class Login {
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

  onSubmit(event: Event) {
    event.preventDefault();
    submit(this.loginForm, async () => {
      const credentials = this.loginModel();
      console.log('Logging in with:', credentials);
      // Add your login logic here
    });
  }
}
