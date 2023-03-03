import { Module } from '@nestjs/common';
import { GameEngineService } from './game_engine.service';

@Module({
  providers: [GameEngineService],
  exports: [GameEngineService],
})
export class GameEngineModule {}
