import { Role, UserPermission, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from './users.service';

function prismaWithTransaction(user: Record<string, jest.Mock>): PrismaService {
  const transactionClient = { user };
  const transaction = jest.fn(
    async (callback: (client: typeof transactionClient) => Promise<unknown>) =>
      callback(transactionClient),
  );
  return {
    ...transactionClient,
    $transaction: transaction,
  } as unknown as PrismaService;
}

describe('UsersService', () => {
  it('persists the normalized username when creating a user', async () => {
    const createdUser = {
      id: 'user-id',
      username: 'newrider',
      email: 'rider@example.com',
      passwordHash: 'hashed-password',
      role: Role.USER,
      createdAt: new Date('2026-10-02T00:00:00.000Z'),
      updatedAt: new Date('2026-10-02T00:00:00.000Z'),
    };
    const prismaService = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(createdUser),
      },
    } as unknown as PrismaService;
    const usersService = new UsersService(prismaService);

    await usersService.create({
      username: '  NewRider  ',
      email: 'Rider@Example.com',
      password: 'password123',
    });

    expect(prismaService.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        username: 'newrider',
        email: 'rider@example.com',
      }),
    });
  });

  it('creates managed users with normalized details and default incident permissions', async () => {
    const prismaService = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'managed-user-id',
          username: 'newrider',
          email: 'rider@example.com',
          role: Role.USER,
          status: UserStatus.ACTIVE,
          permissions: [
            UserPermission.INCIDENTS_READ,
            UserPermission.INCIDENTS_UPDATE,
          ],
        }),
      },
    } as unknown as PrismaService;
    const usersService = new UsersService(prismaService);

    await usersService.createManaged(
      {
        username: '  NewRider  ',
        email: ' Rider@Example.com ',
        password: 'password123',
      },
      { id: 'admin-id', role: Role.ADMIN },
    );

    expect(prismaService.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          username: 'newrider',
          email: 'rider@example.com',
          role: Role.USER,
          status: UserStatus.ACTIVE,
          permissions: [
            UserPermission.INCIDENTS_READ,
            UserPermission.INCIDENTS_UPDATE,
          ],
        }),
        select: expect.objectContaining({ permissions: true, status: true }),
      }),
    );
  });

  it('prevents non-admin managers from granting administrative permissions', async () => {
    const prismaService = prismaWithTransaction({
      findUnique: jest.fn().mockResolvedValue({
        id: 'target-user',
        role: Role.USER,
        status: UserStatus.ACTIVE,
        permissions: [UserPermission.INCIDENTS_READ],
      }),
    });
    const usersService = new UsersService(prismaService);

    await expect(
      usersService.updateManaged(
        'target-user',
        { permissions: [UserPermission.USERS_MANAGE] },
        { id: 'manager-id', role: Role.USER },
      ),
    ).rejects.toThrow('Only administrators can grant administrative access');
  });

  it('prevents removal of the last active administrator', async () => {
    const prismaService = prismaWithTransaction({
      findUnique: jest.fn().mockResolvedValue({
        id: 'last-admin',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        permissions: [],
      }),
      count: jest.fn().mockResolvedValue(1),
      delete: jest.fn(),
    });
    const usersService = new UsersService(prismaService);

    await expect(
      usersService.removeManaged('last-admin', {
        id: 'other-admin',
        role: Role.ADMIN,
      }),
    ).rejects.toThrow('The last active administrator cannot be removed');
    expect(prismaService.user.delete).not.toHaveBeenCalled();
  });

  it('prevents suspending the last active administrator inside a serializable transaction', async () => {
    const prismaService = prismaWithTransaction({
      findUnique: jest.fn().mockResolvedValue({
        id: 'last-admin',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        permissions: [],
      }),
      count: jest.fn().mockResolvedValue(1),
      update: jest.fn(),
    });
    const usersService = new UsersService(prismaService);

    await expect(
      usersService.updateManaged(
        'last-admin',
        { status: UserStatus.SUSPENDED },
        { id: 'other-admin', role: Role.ADMIN },
      ),
    ).rejects.toThrow('The last active administrator cannot be removed');
    expect(prismaService.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { isolationLevel: 'Serializable' },
    );
    expect(prismaService.user.update).not.toHaveBeenCalled();
  });
});
