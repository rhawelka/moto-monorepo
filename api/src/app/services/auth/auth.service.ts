import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto, CreateUserDto } from '@moto-monorepo/dto';
import { LoggerService } from '@moto-monorepo/services';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private logger: LoggerService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    const token = this.generateToken(user.id, user.email, user.role);

    return { user, access_token: token };
  }

  async login(dto: LoginDto) {
    this.logger.log(`Login attempt for email in service: ${dto.email}`);

    const user = await this.usersService.findByEmail(dto.email);
    this.logger.log(
      `User found in service: ${user ? user.email : 'not found'}`,
    );

    if (!user) {
      this.logger.warn(`Login failed for email: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isMatch) {
      this.logger.warn(
        `Login failed for email: ${dto.email} - password mismatch`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user: { id: user.id, email: user.email, role: user.role },
      access_token: token,
    };
  }

  private generateToken(userId: string, email: string, role: string): string {
    return this.jwtService.sign({ sub: userId, email, role });
  }
}
