import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '@moto-monorepo/dto';
import { PrismaService } from '../../database/prisma.service';
import { Role } from '@prisma/client';

// TODO move to interfaces folder
export interface User {
  id: string;
  username: string | null;
  email: string;
  passwordHash: string;
  role: Role;
}

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findByEmail(email: string): Promise<User | undefined> {
    return this.prismaService.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
  }

  async findByEmailOrUsername(identifier: string): Promise<User | undefined> {
    const normalizedIdentifier = this.normalizeEmail(identifier);
    return this.prismaService.user.findFirst({
      where: {
        OR: [
          { email: normalizedIdentifier },
          { username: normalizedIdentifier },
        ],
      },
    });
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.findByEmail(email);

    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const newUser = await this.prismaService.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    const { passwordHash: _, ...result } = newUser;

    return result;
  }

  async findNonAdminUsers() {
    return this.prismaService.user.findMany({
      where: { role: { not: Role.ADMIN } },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
