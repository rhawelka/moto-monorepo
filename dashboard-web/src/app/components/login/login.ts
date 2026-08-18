import { LoginDto } from '@moto-monorepo/dto';
import { Component, signal } from '@angular/core';
import { form } from '@angular/forms/signals';

@Component({
  selector: 'app-login',
  imports: [],
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

  loginForm = form(this.loginModel);
}
