import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user/user.entity';
// import { SocketModule } from './socket/socket.module';
// import { AuthModule } from './auth/auth.module';
import { AuthModule } from './auth/auth.module';
import { GameUpdateCenterModule } from './game_update_center/game_update_center.module';
import { ChatModule } from './chat/chat.module';
import { GameEngineModule } from './game_engine/game_engine.module';
import { PongEngineModule } from './pong_engine/pong_engine.module';
import { Match } from './match/Match';
import { MatchModule } from './match/Match.module';

@Module({
  imports: [
    AppModule,
    ChatModule,
    UserModule,
    AuthModule,
    MatchModule,
    GameUpdateCenterModule,
    GameEngineModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db_container',
      port: 5432,
      username: 'postgres',
      password: 'inception',
      database: 'users',
      entities: [UserEntity],
      autoLoadEntities: true,
      synchronize: true,
    }),
    PongEngineModule,
  ],
})
export class AppModule {}
