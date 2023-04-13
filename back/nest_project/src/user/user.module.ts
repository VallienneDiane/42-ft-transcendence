import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "src/auth/auth.module";
import { AuthService } from "src/auth/auth.service";
import { JwtStrategy } from "../auth_strategies/jwt.strategy";
import { UserController } from "./user.controller";
import { UserEntity } from "./user.entity";
import { UserService } from "./user.service";

//When you create a module, you have to add it in the app.module imports

@Module({
    imports: 
    [
        TypeOrmModule.forFeature([UserEntity]),
        PassportModule.register({}),
        JwtModule.register({
            secret: process.env.SECRET, 
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [UserController],
    providers: [UserService, JwtStrategy, AuthService],
    exports: [UserService],
})
export class UserModule {}