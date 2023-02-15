import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user/user.entity';
// import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AppModule,
    UserModule,
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
