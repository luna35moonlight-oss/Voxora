import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { parseApiEnv, parseCorsOrigins } from '@voxora/config';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { correlationMiddleware } from './common/correlation.middleware';

loadEnv();

async function bootstrap() {
  const env = parseApiEnv(process.env);
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(helmet());
  app.use(correlationMiddleware);
  app.enableCors({
    origin: parseCorsOrigins(env.CORS_ORIGINS),
    credentials: true,
  });
  app.setGlobalPrefix('v1');
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(env.API_PORT, env.API_HOST);
}

bootstrap();
