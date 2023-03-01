import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user/user.entity';
// import { SocketModule } from './socket/socket.module';
// import { AuthModule } from './auth/auth.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    AppModule,
    ChatModule,
    UserModule,
    AuthModule,
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
    })
  ],
})
export class AppModule {}
