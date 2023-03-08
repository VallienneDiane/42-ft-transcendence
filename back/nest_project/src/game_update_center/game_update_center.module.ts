import { Module } from '@nestjs/common';
import { Ball } from 'src/game_engine/Ball';
import { GameEngineModule } from 'src/game_engine/game_engine.module';
import { Vec2 } from 'src/game_engine/math/Vec2';
import { GameUpdateCenterGateway } from './game_update_center.gateway';

@Module({
    providers: [GameUpdateCenterGateway],
    imports: [GameEngineModule],
})
export class GameUpdateCenterModule {}
