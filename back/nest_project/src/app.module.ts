import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BoolJohnController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController, BoolJohnController],
  providers: [AppService],
})
export class AppModule {}
