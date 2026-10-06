import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from './users.service';

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
});
