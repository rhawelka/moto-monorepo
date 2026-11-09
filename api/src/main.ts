/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const configuredFrontendUrl =
    process.env.FRONTEND_URL ?? 'http://localhost:4200';
  const frontendOrigin = new URL(configuredFrontendUrl).origin;
  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? [frontendOrigin]
      : [frontendOrigin, 'http://localhost:4200', 'http://127.0.0.1:4200'];
  app.enableCors({
    origin: allowedOrigins,
  });
  app.setGlobalPrefix('api/v1');
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
}

bootstrap();
