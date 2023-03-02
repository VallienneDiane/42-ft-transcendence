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
    const twoFactorSecret = await this.authService.genTwoFactorSecret(id, login);
    await this.userService.turnOnTwoFactor(id);
    const qrcode = await this.authService.generateQrCodeDataURL(twoFactorSecret.otpauthUrl);
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
      console.log("Code is false !! ")
      throw new UnauthorizedException('Wrong authentication code');
    }
    console.log("Code is valid :) ")
    return { message: 'Code verified successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth/disable2fa')
  async disableTwoFactorAuth(@Headers('Authorization') token: string) {
      const user = await this.authService.decodeToken(token);
      return await this.userService.turnOffTwoFactor(user.id);
    }
    
    @UseGuards(JwtAuthGuard)
    @Get('auth/is2faActive')
    async checkStatusGoogleAuth(@Headers('Authorization') token: string) {
      const infosToken = await this.authService.decodeToken(token);
      const user = await this.userService.findByLogin(infosToken.login);
      return user.isTwoFactorEnabled;
  }
}