import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');

  /**
   * A blank CORS_ORIGIN must not mean "trust nothing".
   *
   * `config.get(key, fallback)` returns '' when the key exists but is empty, so
   * the fallback never fires and `''.split(',')` yields [''] — an allow-list
   * matching no origin at all. The site then loads perfectly and fails on every
   * request, with a healthy API and nothing in its logs. Dashboard fields also
   * pick up stray whitespace and trailing slashes on paste, neither of which
   * survives string equality against the browser's Origin header.
   */
  const origins = config
    .get<string>('CORS_ORIGIN', '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const allowedOrigins = origins.length > 0 ? origins : ['http://localhost:3000'];

  app.enableCors({ origin: allowedOrigins, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip properties with no decorator
      forbidNonWhitelisted: true, // 400 on unexpected properties
      transform: true,            // coerce payloads into DTO instances
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}/api`);
  // Printed so a browser blocked by CORS can be diagnosed from the logs alone.
  console.log(`CORS allows: ${allowedOrigins.join(', ')}`);
}

void bootstrap();
