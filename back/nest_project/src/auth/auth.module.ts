import { Module } from "@nestjs/common";
import { UserModule } from "src/user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "../auth_strategies/jwt.strategy";
import { LocalStrategy } from "../auth_strategies/local.strategy";
import { FortyTwoStrategy } from "../auth_strategies/42.strategy";

@Module({
    imports: 
    [
        UserModule,
        PassportModule.register({}),
        JwtModule.register({
            secret: process.env.SECRET, 
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, LocalStrategy, FortyTwoStrategy],
    exports: [PassportModule, JwtModule]
  })

  export class AuthModule { }