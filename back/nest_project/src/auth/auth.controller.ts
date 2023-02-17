import { Controller, Body, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthDto } from "./auth.dto";
import { AuthService } from "./auth.service";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @UseGuards(AuthGuard)
    @Post() // localhost:3000/auth
    async signin(@Body() user: AuthDto) {
        return await this.authService.validateUserInfos(user.login, user.password);
    }
}