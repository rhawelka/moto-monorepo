import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './controllers/auth/auth.controller';
import { LoginController } from './controllers/login/login.controller';
import { AuthService } from './services/auth/auth.service';
import { UsersService } from './services/users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { LoggerService } from '@moto-monorepo/services';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../app/services/jwt.strategy';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AppController, AuthController, LoginController],
  providers: [
    AppService,
    AuthService,
    UsersService,
    LoggerService,
    JwtStrategy,
  ],
})
export class AppModule {}
