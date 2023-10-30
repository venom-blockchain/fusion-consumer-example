import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common/interfaces';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    { logger: process.env.NODE_ENV === 'dev'? ['error', 'warn', 'log', 'debug', 'verbose'] : ['error', 'warn'] }
  );
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe())

  await configureApp(app, configService);
  await app.listen(configService.get<number>('APP_PORT'));
}

async function configureApp(app: INestApplication, configService: ConfigService) {
  if (configService.get<string>('NODE_ENV') === 'dev')
  {
    const swaggerImport = await import('@nestjs/swagger');
    const swaggerConfig = new swaggerImport.DocumentBuilder()
      .setTitle('Cripto product backend')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = swaggerImport.SwaggerModule.createDocument(app, swaggerConfig);
    swaggerImport.SwaggerModule.setup('api', app, document);
  }
}

bootstrap();
