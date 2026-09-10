import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: { register: jest.Mock };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reject passwords that do not match', () => {
    component.registerForm.setValue({
      email: 'rider@example.com',
      password: 'password123',
      confirmPassword: 'different123',
    });

    component.onRegisterSubmit(new Event('submit'));

    expect(component.registerForm.hasError('passwordsMismatch')).toBe(true);
    expect(component.registerForm.touched).toBe(true);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should register valid credentials and log the mock email', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    authService.register.mockReturnValue(
      of({
        user: { id: 'user-id', email: 'rider@example.com' },
        access_token: 'token',
      }),
    );
    component.registerForm.setValue({
      email: 'rider@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.onRegisterSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(authService.register).toHaveBeenCalledWith({
      email: 'rider@example.com',
      password: 'password123',
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Mock email will be sent to rider@example.com',
    );
    consoleSpy.mockRestore();
  });

  it('should show an error when registration fails', async () => {
    authService.register.mockReturnValue(
      throwError(() => new Error('Email already exists')),
    );
    component.registerForm.setValue({
      email: 'rider@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    component.onRegisterSubmit(new Event('submit'));
    await fixture.whenStable();

    expect(component.errorMessage()).toBe(
      'Registration failed. This email may already be registered.',
    );
  });

  it('should toggle password visibility independently', () => {
    const event = new MouseEvent('click');

    component.onClickRevealPassword(event);
    expect(component.passwordVisible()).toBe(true);
    expect(component.confirmPasswordVisible()).toBe(false);

    component.onClickRevealConfirmPassword(event);
    expect(component.passwordVisible()).toBe(true);
    expect(component.confirmPasswordVisible()).toBe(true);

    component.onClickRevealPassword(event);
    expect(component.passwordVisible()).toBe(false);
    expect(component.confirmPasswordVisible()).toBe(true);
  });
});
