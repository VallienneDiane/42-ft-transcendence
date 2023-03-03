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
    const {id, login} = await this.authService.decodeToken(token);
    const secret = await this.authService.genTwoFactorSecretOtpauthurl(id, login);
    const qrcode = await this.authService.generateQrCode(secret.otpauth_url);
    return {
      qrcode,
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('auth/verifyCode2fa')
  async verifyCode(@Body() data: VerifyCodeDto, @Headers('Authorization') token: string) {
    const infosToken = await this.authService.decodeToken(token);
    const user = await this.userService.findByLogin(infosToken.login);
    const isCodeValid = await this.authService.isTwoFactorCodeValid(data.code, user.twoFactorSecret);
    if (!isCodeValid) {
      console.log("code is false")
      throw new UnauthorizedException('Wrong authentication code');
    }
    await this.userService.turnOnTwoFactor(infosToken.id);
    console.log("code is valid");
    return (true);
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('auth/is2faActive')
  async checkStatusGoogleAuth(@Headers('Authorization') token: string) {
    const infosToken = await this.authService.decodeToken(token);
    const user = await this.userService.findByLogin(infosToken.login);
    return (user.isTwoFactorEnabled);
}
  @UseGuards(JwtAuthGuard)
  @Post('auth/disable2fa')
  async disableTwoFactorAuth(@Headers('Authorization') token: string) {
    const user = await this.authService.decodeToken(token);
    await this.userService.turnOffTwoFactor(user.id);
    return { message: 'Google authentificator has been desactivate' };
    }
    
}