import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {} from "class-validator"
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); //instanciate the app
  app.enableCors();

  // Here we can set the maximum payload size limit
  // Je m'en sert pour pouvoir envoyer des images assez larges pour l'avatar
  app.use(bodyParser.json({ limit: '1000mb' }));
  app.use(bodyParser.urlencoded({ limit: '1000mb', extended: true }));
  await app.listen(3000);
  app.useGlobalPipes(new ValidationPipe());
  // additional feature to make sure server shutdown gracefully to try and see
  app.enableShutdownHooks();
}
bootstrap();
