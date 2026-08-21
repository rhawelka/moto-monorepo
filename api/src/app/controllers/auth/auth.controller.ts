import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from '../../services/auth/auth.service';
import { CreateUserDto, LoginDto } from '@moto-monorepo/dto';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '@moto-monorepo/services';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private logger: LoggerService,
  ) {}

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    this.logger.log(`Registering new user with email: ${dto.email}`);
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    this.logger.log(`Login attempt for email: ${dto.email}`);
    return this.authService.login(dto);
  }

  @Post('logout')
  logout() {
    // Stateless JWT logout is handled on client by clearing the token.
    // If using HttpOnly Cookies, clear cookie here via Response.
    return { message: 'Logged out successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
