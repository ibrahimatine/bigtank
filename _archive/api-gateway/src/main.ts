import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

function validateProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
    'CORS_ORIGIN',
    'INTERNAL_API_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes en production : ${missing.join(', ')}`,
    );
  }

  // Verifier que les secrets ne sont pas les valeurs par defaut
  if (process.env.JWT_SECRET?.includes('change_me')) {
    throw new Error('JWT_SECRET doit etre change en production');
  }
  if (process.env.INTERNAL_API_KEY?.includes('change_me') || process.env.INTERNAL_API_KEY?.includes('dev_key')) {
    throw new Error('INTERNAL_API_KEY doit etre change en production');
  }
}

async function bootstrap() {
  validateProductionEnv();
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
  console.log(`API Gateway running on http://localhost:${port}`);
}
bootstrap();
