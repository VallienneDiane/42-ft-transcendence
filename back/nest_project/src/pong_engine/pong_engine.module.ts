import { Module } from '@nestjs/common';
import { PongEngineService } from './pong_engine.service';

@Module({
  providers: [PongEngineService],
  exports: [PongEngineService]
})
export class PongEngineModule {}
