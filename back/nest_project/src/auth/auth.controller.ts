import { Controller, Body, Request, Post, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserDto } from 'src/user/user.dto';
import { AuthService } from './auth.service';

// SIGN IN WITH THE LOGIN AND PASSWORD
// GENERATE TOKEN IF VALID USER
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  
  @Post('login')
  async loginJwt(@Body() user: UserDto) {
    return this.authService.validateUser(user);
  }
}