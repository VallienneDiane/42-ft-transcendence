import { Module } from "@nestjs/common";
import { UserModule } from "src/user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./jwt.strategy";

@Module({
    imports: 
    [
        UserModule,
        PassportModule,
        // PassportModule.register({             
        //     defaultStrategy: 'jwt',
        //     property: 'user',
        //     session: false,
        // }),
        JwtModule.register({
            secret: process.env.SECRET, 
            signOptions: { expiresIn: '60s' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [PassportModule, JwtModule]
  })

  export class AuthModule { }