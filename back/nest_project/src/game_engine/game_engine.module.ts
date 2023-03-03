import { Module } from '@nestjs/common';
import { GameEngineService } from './game_engine.service';

@Module({
  providers: [GameEngineService],
})
export class GameEngineModule {}
