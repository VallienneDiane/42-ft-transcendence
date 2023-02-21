import { Controller, Body, Post, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserDto } from 'src/user/user.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Post('login')
  async loginJwt(@Body() user: UserDto) {
    return this.authService.validateUser(user);
  }

  // @UseGuards(JwtAuthGuard)
  // @Get('user-info')
  // async getUserInfo(@Request() req) {
  //   return req.user;
  // }
}