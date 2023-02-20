import { Controller, Request, Post, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Post('login')
  async loginJwt(@Request() req) {
    return this.authService.loginJwt(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user-info')
  async getUserInfo(@Request() req) {
    return req.user;
  }
}