import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { UserPermission } from '@prisma/client';
import { PermissionsGuard } from '../../services/permissions.guard';
import { REQUIRED_PERMISSIONS } from '../../services/permissions';
import { UsersService } from '../../services/users/users.service';
import { UsersController } from './users.controller';

describe('UsersController', () => {
  const users = [
    {
      id: 'user-1',
      username: 'rider',
      email: 'user@example.com',
      role: 'USER',
      status: 'ACTIVE',
      permissions: [UserPermission.INCIDENTS_READ],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  ];
  let usersService: jest.Mocked<
    Pick<
      UsersService,
      'findAll' | 'createManaged' | 'updateManaged' | 'removeManaged'
    >
  >;
  let controller: UsersController;

  beforeEach(() => {
    usersService = {
      findAll: jest.fn().mockResolvedValue(users),
      createManaged: jest.fn().mockResolvedValue(users[0]),
      updateManaged: jest.fn().mockResolvedValue(users[0]),
      removeManaged: jest.fn().mockResolvedValue(undefined),
    };
    controller = new UsersController(usersService as unknown as UsersService);
  });

  it('protects the full user collection with JWT and USERS_MANAGE', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, UsersController);
    const handler = UsersController.prototype.findAll;

    expect(Reflect.getMetadata(PATH_METADATA, UsersController)).toBe('users');
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('/');
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(0);
    expect(guards).toHaveLength(2);
    expect(typeof guards[0].prototype.canActivate).toBe('function');
    expect(guards[1]).toBe(PermissionsGuard);
    expect(Reflect.getMetadata(REQUIRED_PERMISSIONS, handler)).toEqual([
      UserPermission.USERS_MANAGE,
    ]);
  });

  it('lists every user through the managed-user service', async () => {
    await expect(controller.findAll()).resolves.toEqual(users);
    expect(usersService.findAll).toHaveBeenCalledTimes(1);
  });

  it('passes create, update, and delete requests to the service with the actor', async () => {
    const actor = { id: 'admin-id', role: 'ADMIN' as const };
    const createDto = {
      username: 'new-rider',
      email: 'new@example.com',
      password: 'password123',
    };
    const updateDto = { status: 'SUSPENDED' as const };

    await controller.create(createDto, { user: actor } as never);
    await controller.update('user-id', updateDto, { user: actor } as never);
    await controller.remove('user-id', { user: actor } as never);

    expect(usersService.createManaged).toHaveBeenCalledWith(createDto, actor);
    expect(usersService.updateManaged).toHaveBeenCalledWith(
      'user-id',
      updateDto,
      actor,
    );
    expect(usersService.removeManaged).toHaveBeenCalledWith('user-id', actor);
  });
});
