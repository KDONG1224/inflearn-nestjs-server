import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exception-filter/http.exception-filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  /**
   * 모든곳에 적용되는 파이프
   */
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      },
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  console.log('http://localhost:3000');
}
bootstrap();
