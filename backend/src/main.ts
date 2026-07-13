import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('apiPrefix', 'api');
  const swaggerPath = config.get<string>('swaggerPath', 'docs');
  const port = config.get<number>('port', 3000);
  const corsOrigin = config.get<string>('corsOrigin', '*');

  // Préfixe global : /api/...
  app.setGlobalPrefix(apiPrefix);

  // CORS
  app.enableCors({ origin: corsOrigin === '*' ? true : corsOrigin.split(','), credentials: true });

  // Validation globale des DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Gestion de Transport & Logistique')
    .setDescription('Documentation de l’API backend (NestJS + Prisma)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document);

  await app.listen(port);
  Logger.log(`API disponible sur http://localhost:${port}/${apiPrefix}`, 'Bootstrap');
  Logger.log(`Swagger disponible sur http://localhost:${port}/${swaggerPath}`, 'Bootstrap');
}

bootstrap();
