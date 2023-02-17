import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "src/user/user.entity";
import { UserModule } from "src/user/user.module";
import { UserService } from "src/user/user.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from "./auth.jwt.strategy";

@Module({
    imports: [
        UserModule, 
        PassportModule.register({
            defaultStrategy: 'jwt',
            property: 'user',
            session: false,
        }), 
        JwtModule.register({
            secret: process.env.SECRETKEY, signOptions: {
                expiresIn: process.env.EXPIRESIN,
            },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, UserService, JwtStrategy],
  })
  export class AuthModule { }