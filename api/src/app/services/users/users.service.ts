import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '@moto-monorepo/dto';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Role, UserPermission, UserStatus } from '@prisma/client';
import type { User } from './user.interface';
import {
  CreateManagedUserDto,
  UpdateManagedUserDto,
} from '../../controllers/users/manage-user.dto';

export interface UserActor {
  id: string;
  role: Role;
}

const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  status: true,
  permissions: true,
  createdAt: true,
  updatedAt: true,
} as const;

const PRIVILEGED_PERMISSIONS: UserPermission[] = [
  UserPermission.USERS_MANAGE,
  UserPermission.SETTINGS_MANAGE,
];

type UserPrismaClient = Pick<Prisma.TransactionClient, 'user'>;

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findByEmail(email: string): Promise<User | undefined> {
    return this.prismaService.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  async findByEmailOrUsername(identifier: string): Promise<User | undefined> {
    const normalizedEmailIdentifier = this.normalizeEmail(identifier);
    return this.prismaService.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmailIdentifier },
          { username: normalizedEmailIdentifier },
        ],
      },
    });
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const email = this.normalizeEmail(dto.email);
    const username = dto.username.trim().toLowerCase();
    const existing = await this.findByEmail(email);

    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const newUser = await this.prismaService.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });

    const { passwordHash: _, ...result } = newUser;

    return result;
  }

  async findAll() {
    return this.prismaService.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createManaged(dto: CreateManagedUserDto, actor: UserActor) {
    const role = dto.role ?? Role.USER;
    const permissions = dto.permissions ?? [
      UserPermission.INCIDENTS_READ,
      UserPermission.INCIDENTS_UPDATE,
    ];
    this.assertCanGrant(actor, role, permissions);

    const email = this.normalizeEmail(dto.email);
    const username = dto.username.trim().toLowerCase();
    const [existingEmail, existingUsername] = await Promise.all([
      this.prismaService.user.findUnique({ where: { email } }),
      this.prismaService.user.findUnique({ where: { username } }),
    ]);
    if (existingEmail || existingUsername) {
      throw new ConflictException('Email or username already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prismaService.user.create({
      data: {
        username,
        email,
        passwordHash,
        role,
        status: dto.status ?? UserStatus.ACTIVE,
        permissions,
      },
      select: USER_SELECT,
    });

    return user;
  }

  async updateManaged(id: string, dto: UpdateManagedUserDto, actor: UserActor) {
    return this.runSerializable(async (transaction) => {
      const existing = await this.getManagedUser(id, transaction);
      this.assertCanManageTarget(existing, actor);

      const role = dto.role ?? existing.role;
      const status = dto.status ?? existing.status;
      const permissions = dto.permissions ?? existing.permissions;
      this.assertCanGrant(actor, role, permissions, existing.permissions);

      const username =
        dto.username === undefined
          ? undefined
          : dto.username?.trim().toLowerCase() || null;
      const email =
        dto.email === undefined ? undefined : this.normalizeEmail(dto.email);
      const [existingUsername, existingEmail] = await Promise.all([
        username ? transaction.user.findUnique({ where: { username } }) : null,
        email ? transaction.user.findUnique({ where: { email } }) : null,
      ]);
      if (
        (existingUsername && existingUsername.id !== id) ||
        (existingEmail && existingEmail.id !== id)
      ) {
        throw new ConflictException('Email or username already registered');
      }

      if (
        existing.role === Role.ADMIN &&
        existing.status === UserStatus.ACTIVE &&
        (role !== Role.ADMIN || status !== UserStatus.ACTIVE)
      ) {
        await this.assertNotLastActiveAdmin(transaction);
      }

      const data: {
        username?: string | null;
        email?: string;
        passwordHash?: string;
        role?: Role;
        status?: UserStatus;
        permissions?: UserPermission[];
      } = {
        ...(username !== undefined ? { username } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.permissions !== undefined
          ? { permissions: dto.permissions }
          : {}),
      };
      if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

      return transaction.user.update({
        where: { id },
        data,
        select: USER_SELECT,
      });
    });
  }

  async removeManaged(id: string, actor: UserActor): Promise<void> {
    await this.runSerializable(async (transaction) => {
      const existing = await this.getManagedUser(id, transaction);
      this.assertCanManageTarget(existing, actor);
      if (
        existing.role === Role.ADMIN &&
        existing.status === UserStatus.ACTIVE
      ) {
        await this.assertNotLastActiveAdmin(transaction);
      }

      await transaction.user.delete({ where: { id } });
    });
  }

  private async getManagedUser(
    id: string,
    prisma: UserPrismaClient = this.prismaService,
  ): Promise<User> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async runSerializable<T>(
    work: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.prismaService.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        throw new ConflictException(
          'Concurrent user management change; please retry',
        );
      }
      throw error;
    }
  }

  private assertCanManageTarget(user: User, actor: UserActor): void {
    if (user.id === actor.id) {
      throw new BadRequestException('You cannot manage your own account here');
    }
    if (actor.role !== Role.ADMIN && user.role === Role.ADMIN) {
      throw new ForbiddenException('Only administrators can manage admins');
    }
  }

  private assertCanGrant(
    actor: UserActor,
    role: Role,
    permissions: UserPermission[],
    existingPermissions: UserPermission[] = [],
  ): void {
    if (
      actor.role !== Role.ADMIN &&
      (role === Role.ADMIN ||
        permissions.some(
          (permission) =>
            PRIVILEGED_PERMISSIONS.includes(permission) &&
            !existingPermissions.includes(permission),
        ))
    ) {
      throw new ForbiddenException(
        'Only administrators can grant administrative access',
      );
    }
  }

  private async assertNotLastActiveAdmin(
    prisma: UserPrismaClient = this.prismaService,
  ): Promise<void> {
    const activeAdminCount = await prisma.user.count({
      where: { role: Role.ADMIN, status: UserStatus.ACTIVE },
    });
    if (activeAdminCount <= 1) {
      throw new ConflictException(
        'The last active administrator cannot be removed or suspended',
      );
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
