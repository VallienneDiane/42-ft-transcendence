import { Module } from '@nestjs/common';
import { GameEngineService } from '../game_engine/game_engine.service';

@Module({
    providers: [GameEngineService],
})
export class GameUpdateCenterModule {}
