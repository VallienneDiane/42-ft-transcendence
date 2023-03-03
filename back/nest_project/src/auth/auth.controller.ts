import { Controller, Body, Request, Post, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserDto } from 'src/user/user.dto';
import { AuthService } from './auth.service';

// SIGN IN, LOGIN AND PASSWORD VERIFICATION, NEW TOKEN
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}
  
  //check login and password and generate token
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async genToken(@Body() user: UserDto) {
    return this.authService.login(user);
  }
}