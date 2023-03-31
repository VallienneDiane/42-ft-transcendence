import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); //instanciate the app
  app.enableCors();
  await app.listen(3000);

  // additional feature to make sure server shutdown gracefully to try and see
  app.enableShutdownHooks();
}
bootstrap();
