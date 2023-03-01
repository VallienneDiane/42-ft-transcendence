import { Controller, Body, Request, Post, Get, UseGuards, UnauthorizedException, Req, Headers } from '@nestjs/common';
import { JwtAuthGuard } from 'src/user/jwt-auth.guard';
import { UserDto } from 'src/user/user.dto';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { VerifyCodeDto } from './verifyCode.dto';

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
  @Post('auth/enable2fa')
  async enableTwoFactorAuth(@Body() user: UserDto) {
    const twoFactorSecret = await this.authService.genTwoFactorSecret(user);
    await this.userService.turnOnTwoFactor(user.id);
    const qrcode = await this.authService.generateQrCodeDataURL(twoFactorSecret.otpauthUrl);
    return {
      qrcode,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('verifyCode2fa')
  async verifyCode(@Body() data: VerifyCodeDto) {
    console.log("je suis dans la requete post qui va checher le code ");
    const isCodeValid = await this.authService.isTwoFactorCodeValid(data.code, data.user.twoFactorSecret);
    if (!isCodeValid) {
      console.log("code is false !! ")
      throw new UnauthorizedException('Wrong authentication code');
    }
    console.log("code is valid :) ")
    return { message: 'Code verified successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth/disable2fa')
  async disableTwoFactorAuth(@Body() user: UserDto) {
      return await this.userService.turnOffTwoFactor(user.id);
  }
}