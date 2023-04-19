import { Module } from '@nestjs/common';
import { MatchModule } from 'src/match/Match.module';
import { UserModule } from 'src/user/user.module';
import { PongEngineService } from './pong_engine.service';

@Module({
  imports: [UserModule, MatchModule],
  providers: [PongEngineService],
  exports: [PongEngineService],
})
export class PongEngineModule {}
