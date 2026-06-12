import './instrument'; // MUST BE IMPORTED FIRST
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bind Global Sentry Interceptor for tracing and error tracking
  app.useGlobalInterceptors(new SentryInterceptor());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable Cross-Origin Resource Sharing (CORS) for Next.js frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('dWorkspace API')
    .setDescription('Internal reputation and governance platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
