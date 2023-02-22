import { Controller, Body, Request, Post, Get, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { UserDto } from 'src/user/user.dto';
import { AuthService } from './auth.service';

// SIGN IN WITH THE LOGIN AND PASSWORD
// GENERATE TOKEN IF VALID USER
@Controller()
export class AuthController {
  constructor(private authService: AuthService, private jwtService: JwtService) {}
  
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async genToken(@Body() user: UserDto) {
    const payload = {login: user.login, sub: user.id};
    return {
      access_token: this.jwtService.sign(payload)
    }
  }
}

// const validUser = await this.authService.validateUser(user.login, user.password);
// const payload = {login: validUser.login, sub: validUser.id};