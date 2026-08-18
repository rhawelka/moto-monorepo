import { LoginDto } from '@moto-monorepo/dto';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from '../../services/auth/auth.service';

@Controller('login')
export class LoginController {
  constructor(private authService: AuthService) {}

  @Post('')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('')
  test() {
    return 'test';
  }
}
