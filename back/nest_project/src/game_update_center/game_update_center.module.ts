import { Module } from '@nestjs/common';
import { GameEngineModule } from 'src/game_engine/game_engine.module';
import { GameUpdateCenterGateway } from './game_update_center.gateway';

@Module({
    providers: [GameUpdateCenterGateway],
    imports: [GameEngineModule],
})
export class GameUpdateCenterModule {}
