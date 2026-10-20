import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth/auth.controller';
import { LoginController } from './controllers/login/login.controller';
import { AuthService } from './services/auth/auth.service';
import { UsersService } from './services/users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { LoggerService } from '@moto-monorepo/services';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../app/services/jwt.strategy';
import { DatabaseModule } from './database/database.module';
import { UsersController } from './controllers/users/users.controller';
import { AdminGuard } from './services/admin.guard';
import { IncidentsController } from './controllers/incidents/incidents.controller';
import { IncidentsService } from './services/incidents/incidents.service';
import { IncidentsGateway } from './services/incidents/incidents.gateway';

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
  controllers: [
    AuthController,
    LoginController,
    UsersController,
    IncidentsController,
  ],
  providers: [
    AuthService,
    UsersService,
    LoggerService,
    JwtStrategy,
    AdminGuard,
    IncidentsService,
    IncidentsGateway,
  ],
})
export class AppModule {}
