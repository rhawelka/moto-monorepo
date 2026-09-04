import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '@moto-monorepo/dto';
import { PrismaService } from '../../database/prisma.service';
import { Role } from '@prisma/client';

// TODO move to interfaces folder
export interface User {
  id: string;
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

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
