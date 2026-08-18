import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './controllers/auth/auth.controller';
import { LoginController } from './controllers/login/login.controller';
import { AuthService } from './services/auth/auth.service';
import { UsersService } from './services/users/users.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [AppController, AuthController, LoginController],
  providers: [AppService, AuthService, UsersService, JwtService],
})
export class AppModule {}
