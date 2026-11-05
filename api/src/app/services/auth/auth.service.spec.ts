jest.mock('@moto-monorepo/services', () => ({
  LoggerService: class LoggerService {},
}));

import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService Google login', () => {
  const user = {
    id: 'user-id',
    username: 'rider',
    email: 'rider@example.com',
    passwordHash: 'password-hash',
    role: 'USER',
  };
  const usersService = {
    findByEmail: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn(),
  };
  const logger = {
    log: jest.fn(),
    warn: jest.fn(),
  };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      usersService as never,
      jwtService as never,
      logger as never,
    );
    jwtService.sign.mockReturnValue('signed-token');
  });

  it('issues an application token for an existing account', async () => {
    usersService.findByEmail.mockResolvedValue(user);

    await expect(service.loginWithGoogle('rider@example.com')).resolves.toEqual(
      {
        user: { id: 'user-id', email: 'rider@example.com', role: 'USER' },
        access_token: 'signed-token',
      },
    );
    expect(usersService.findByEmail).toHaveBeenCalledWith('rider@example.com');
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'user-id',
      email: 'rider@example.com',
      role: 'USER',
    });
  });

  it('does not create accounts for unknown Google emails', async () => {
    usersService.findByEmail.mockResolvedValue(undefined);

    await expect(
      service.loginWithGoogle('unknown@example.com'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });
});
