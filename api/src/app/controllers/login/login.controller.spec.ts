jest.mock('@moto-monorepo/services', () => ({
  LoggerService: class LoggerService {},
}));

import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Role } from '@prisma/client';
import { AuthService } from '../../services/auth/auth.service';
import { LoginController } from './login.controller';

describe('LoginController', () => {
  let authService: jest.Mocked<Pick<AuthService, 'login'>>;
  let controller: LoginController;

  beforeEach(() => {
    authService = {
      login: jest.fn(),
    };
    controller = new LoginController(authService as unknown as AuthService);
  });

  it('exposes a POST /login endpoint', () => {
    expect(Reflect.getMetadata(PATH_METADATA, LoginController)).toBe('login');
    expect(
      Reflect.getMetadata(PATH_METADATA, LoginController.prototype.login),
    ).toBe('/');
    expect(
      Reflect.getMetadata(METHOD_METADATA, LoginController.prototype.login),
    ).toBe(1);
  });

  it('passes login credentials to AuthService and returns its response', async () => {
    const dto = {
      email: 'rider@example.com',
      password: 'secure-password',
    };
    const authResponse = {
      user: { id: 'user-id', email: dto.email, role: Role.USER },
      access_token: 'access-token',
    };
    authService.login.mockResolvedValue(authResponse);

    await expect(controller.login(dto)).resolves.toBe(authResponse);
    expect(authService.login).toHaveBeenCalledTimes(1);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('propagates login errors from AuthService', async () => {
    const error = new Error('Invalid credentials');
    authService.login.mockRejectedValue(error);

    await expect(
      controller.login({
        email: 'rider@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBe(error);
  });
});
