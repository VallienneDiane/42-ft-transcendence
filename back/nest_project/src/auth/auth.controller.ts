import { Controller, Body, Request, Post, Get, UseGuards } from '@nestjs/common';
import { UserDto } from 'src/user/user.dto';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';

// SIGN IN, LOGIN AND PASSWORD VERIFICATION, NEW TOKEN
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}
  
  //check login and password with stratgey local of passport and generate token
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async genToken(@Body() user: UserDto) {
    return this.authService.login(user);
  }

  @Post('auth/otp/generate')
  async generateTwoFactorSecretCode() {
    const secretCode = await this.authService.genTwoFactorSecretCode();
    return secretCode;
  }
}