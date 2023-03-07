import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtStrategy } from "src/auth/jwt.strategy";
import { ChatModule } from "src/chat/chat.module";
import { ChatService } from "src/chat/chat.service";
import { UserController } from "./user.controller";
import { UserEntity } from "./user.entity";
import { UserService } from "./user.service";

//When you create a module, you have to add it in the app.module imports
// configure user repository l.10
@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
        PassportModule.register({
            defaultStrategy: 'jwt',
            property: 'user',
            session: false,
        }),
        JwtModule.register({
            secret: process.env.SECRET, 
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [UserController],
    providers: [UserService, JwtStrategy],
    exports: [UserService],
})
export class UserModule {}