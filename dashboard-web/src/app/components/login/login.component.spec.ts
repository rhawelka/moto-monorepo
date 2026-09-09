import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: { login: jest.Mock };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit an invalid form', () => {
    component.onLoginSubmit(new Event('submit'));

    expect(component.loginForm.touched).toBe(true);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should submit valid credentials', async () => {
    authService.login.mockReturnValue(
      of({
        user: { id: 'user-id', email: 'rider@example.com' },
        access_token: 'token',
      }),
    );
    component.loginForm.setValue({
      email: 'rider@example.com',
      password: 'password123',
    });

    component.onLoginSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'rider@example.com',
      password: 'password123',
    });
  });

  it('should show an error when login fails', async () => {
    authService.login.mockReturnValue(
      throwError(() => new Error('Invalid credentials')),
    );
    component.loginForm.setValue({
      email: 'rider@example.com',
      password: 'password123',
    });

    component.onLoginSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(component.errorMessage()).toBe(
      'Login failed. Check your email and password.',
    );
  });

  it('should toggle password visibility', () => {
    const event = new MouseEvent('click');

    expect(component.passwordVisible()).toBe(false);

    component.onClickRevealPassword(event);
    expect(component.passwordVisible()).toBe(true);

    component.onClickRevealPassword(event);
    expect(component.passwordVisible()).toBe(false);
  });
});
