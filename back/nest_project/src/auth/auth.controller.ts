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
  async enableTwoFactorAuth(@Headers('Authorization') token: string) {
    const user = await this.authService.decodeToken(token);
    const qrcode = await this.authService.generateQRcode(user.id);
    return {
      qrcode
    }
  }
  
  // @UseGuards(JwtAuthGuard)
  @Post('auth/verifyCode')
  async verifyCode(@Body() data: VerifyCodeDto, @Headers('Authorization') token: string) {
    const infosToken = await this.authService.decodeToken(token);
    const user = await this.userService.findByLogin(infosToken.login);
    console.log("code :", data.code, "user.secret" , user.twoFactorSecret);
    const isCodeValid = await this.authService.isTwoFactorCodeValid(data.code, user.twoFactorSecret);
    const isActive = await this.userService.turnOnTwoFactor(user.id);
    return {
      isCodeValid,
      isActive,
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('auth/disable2fa')
  async disableTwoFactorAuth(@Headers('Authorization') token: string) {
    const user = await this.authService.decodeToken(token);
    const isActive = await this.userService.turnOffTwoFactor(user.id);
    return (isActive);
  }

  @UseGuards(JwtAuthGuard)
  @Get('auth/is2faActive')
  async checkStatusGoogleAuth(@Headers('Authorization') token: string) {
    const infosToken = await this.authService.decodeToken(token);
    const user = await this.userService.findByLogin(infosToken.login);
    const qrcode = user.qrCode;
    const isActive = user.isTwoFactorEnabled;
    return {
      isActive,
      qrcode,
    }
  }
}