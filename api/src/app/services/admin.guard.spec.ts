import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  const createContext = (user: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as ExecutionContext;

  it('allows users with the ADMIN role', () => {
    expect(guard.canActivate(createContext({ role: 'ADMIN' }))).toBe(true);
  });

  it('rejects users without the ADMIN role', () => {
    expect(() => guard.canActivate(createContext({ role: 'USER' }))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects requests without an authenticated user', () => {
    expect(() => guard.canActivate(createContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
