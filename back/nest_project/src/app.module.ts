import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BoolJohnController } from './app.controller';
import { AppService, JohnBouleService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController, BoolJohnController],
  providers: [AppService, JohnBouleService],
})
export class AppModule {}
