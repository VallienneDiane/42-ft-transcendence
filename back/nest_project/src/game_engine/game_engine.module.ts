import { Module } from '@nestjs/common';
import { MatchModule } from 'src/match/Match.module';
import { UserModule } from 'src/user/user.module';
import { Ball } from './Ball';
import { GameEngineService } from './game_engine.service';
import { Vec2 } from './match/Vec2';

@Module({
  imports: [UserModule, MatchModule],
  providers: [GameEngineService],
  exports: [GameEngineService]
})
export class GameEngineModule {}
