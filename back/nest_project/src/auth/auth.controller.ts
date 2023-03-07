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
  async isValidUser() {
    return (true);
  }
  
  // @UseGuards(LocalAuthGuard)
  @Post('auth/generateToken')
  async genToken(@Body() data: UserDto) {
    const token = await this.authService.genToken(data.login);
    console.log("TOKEN ? ", token);
    return token;
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('auth/enable2fa')
  async enableTwoFactorAuth(@Headers('Authorization') token: string) {
    const user = await this.authService.decodeToken(token);
    const qrcode = await this.authService.generateQRcode(user.id);
    return {
      qrcode,
    }
  }
  
  // @UseGuards(JwtAuthGuard)
  @Post('auth/verifyCode')
  async verifyCode(@Body() data: VerifyCodeDto) {
    console.log("REQUEST VERIFY CODE SUBMITTED");
    const user = await this.userService.findByLogin(data.login);
    console.log("code :", data.code, "user.secret" , user.twoFactorSecret);
    const isCodeValid = await this.authService.isTwoFactorCodeValid(data.code, user.twoFactorSecret);
    const is2faActive = await this.userService.turnOnTwoFactor(user.id);
    return {
      isCodeValid,
      is2faActive,
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('auth/disable2fa')
  async disableTwoFactorAuth(@Headers('Authorization') token: string) {
    console.log("REQUEST DISABLE 2fa");
    const user = await this.authService.decodeToken(token);
    const is2faActive = await this.userService.turnOffTwoFactor(user.id);
    return (is2faActive);
  }
  
  // @UseGuards(JwtAuthGuard)
  @Post('auth/is2faActive')
  async isGoogleAuthActivated(@Body() user: UserDto) {
    console.log("login ? ", user.login);
    const validUser = await this.userService.findByLogin(user.login);
    const is2faActive = validUser.isTwoFactorEnabled;
    // console.log("RESULT in controller : is2faActive ? ", is2faActive);
    return (is2faActive);
  }
}