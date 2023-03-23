import { Module } from '@nestjs/common';
import { Ball } from './Ball';
import { GameEngineService } from './game_engine.service';
import { Vec2 } from './math/Vec2';

@Module({
  providers: [GameEngineService],
  exports: [GameEngineService]
})
export class GameEngineModule {}
