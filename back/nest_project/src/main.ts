import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {} from "class-validator"
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); //instanciate the app
  app.enableCors();
  await app.listen(3000);
  app.useGlobalPipes(new ValidationPipe());
  // additional feature to make sure server shutdown gracefully to try and see
  app.enableShutdownHooks();
}
bootstrap();
