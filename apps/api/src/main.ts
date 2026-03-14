import * as Sentry from '@sentry/nestjs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

// Initialiser Sentry avant tout le reste
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.2,
    enabled: process.env.NODE_ENV === 'production',
  });
}

function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
    'CORS_ORIGIN',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes en production : ${missing.join(', ')}`,
    );
  }

  if (process.env.JWT_SECRET?.includes('change_me')) {
    throw new Error('JWT_SECRET doit etre change en production');
  }
}

async function bootstrap() {
  validateProductionEnv();
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin.includes(',') ? corsOrigin.split(',').map(s => s.trim()) : corsOrigin,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Samadal API running on http://localhost:${port}`);
}
bootstrap();
