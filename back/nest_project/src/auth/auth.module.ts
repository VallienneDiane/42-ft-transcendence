import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

//When you create a module, you have to add it in the app.module imports
@Module({
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule {}