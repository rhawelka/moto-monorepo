import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { AdminGuard } from '../../services/admin.guard';
import { UsersService } from '../../services/users/users.service';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  const users = [
    {
      id: 'user-1',
      username: null,
      email: 'user@example.com',
      role: 'USER',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  ];
  let usersService: jest.Mocked<Pick<UsersService, 'findNonAdminUsers'>>;
  let controller: UsersController;

  beforeEach(() => {
    usersService = {
      findNonAdminUsers: jest.fn().mockResolvedValue(users),
    };
    controller = new UsersController(usersService as unknown as UsersService);
  });

  it('exposes a GET /users endpoint protected by JWT and AdminGuard', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, UsersController);

    expect(Reflect.getMetadata(PATH_METADATA, UsersController)).toBe('users');
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        UsersController.prototype.findNonAdminUsers,
      ),
    ).toBe('/');
    expect(
      Reflect.getMetadata(
        METHOD_METADATA,
        UsersController.prototype.findNonAdminUsers,
      ),
    ).toBe(0);
    expect(guards).toHaveLength(2);
    expect(typeof guards[0].prototype.canActivate).toBe('function');
    expect(guards[1]).toBe(AdminGuard);
  });

  it('returns the non-admin users from the service', async () => {
    await expect(controller.findNonAdminUsers()).resolves.toEqual(users);
    expect(usersService.findNonAdminUsers).toHaveBeenCalledTimes(1);
  });
});
