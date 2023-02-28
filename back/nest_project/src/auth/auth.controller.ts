import { Controller, Body, Request, Post, Get, UseGuards, UnauthorizedException, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/user/jwt-auth.guard';
import { UserDto } from 'src/user/user.dto';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';

// SIGN IN, LOGIN AND PASSWORD VERIFICATION, NEW TOKEN
@Controller()
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}
  
  //check login and password with stratgey local of passport and generate token
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async genToken(@Body() user: UserDto) {
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth/enableTwoFactorAuth')
  async turnOnTwoFactorAuth(@Body() user: UserDto) {
    const twoFactorSecret = await this.authService.genTwoFactorSecret(user);
    const isCodeValid = this.authService.isTwoFactorCodeValid(twoFactorSecret.secret, user);
    if(!isCodeValid) {
        throw new UnauthorizedException('Wrong authentication code');
    }
    await this.userService.turnOnTwoFactor(user.id);
    const qrcode = await this.authService.generateQrCodeDataURL(twoFactorSecret.otpauthUrl);
    return {
      qrcode,
    }
  }
}