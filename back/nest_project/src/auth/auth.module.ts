import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthEntity } from "./auth.entity";
import { AuthService } from "./auth.service";

//When you create a module, you have to add it in the app.module imports
@Module({
    imports: [TypeOrmModule.forFeature([AuthEntity])],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule {}