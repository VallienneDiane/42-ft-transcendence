import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GameEngineModule } from 'src/game_engine/game_engine.module';
import { MatchModule } from 'src/match/Match.module';
import { PongEngineModule } from 'src/pong_engine/pong_engine.module';
import { UserModule } from 'src/user/user.module';
import { GameUpdateCenterGateway } from './game_update_center.gateway';

@Module({
    providers: [GameUpdateCenterGateway],
    imports: [GameEngineModule, PongEngineModule, UserModule, MatchModule,
        JwtModule.register({
            secret: process.env.SECRET, 
            signOptions: { expiresIn: '1d' },
        }),
    ],
})
export class GameUpdateCenterModule {}
