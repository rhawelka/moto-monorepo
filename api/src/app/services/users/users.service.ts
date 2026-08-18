import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '@moto-monorepo/dto';

// TODO move to interfaces folder
export interface User {
  id: string;
  email: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  private users: User[] = []; // In-memory fallback for example

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email === email);
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const newUser: User = {
      id: Date.now().toString(),
      email: dto.email,
      passwordHash,
    };
    this.users.push(newUser);

    const { passwordHash: _, ...result } = newUser;
    return result;
  }
}
