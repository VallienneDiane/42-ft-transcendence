import { Controller, Body, Post, Get, UseGuards, Headers, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth_strategies/jwt-auth.guard';
import { UserDto } from 'src/user/user.dto';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../auth_strategies/local-auth.guard';
import { VerifyCodeDto } from './verifyCode.dto';
import { JwtService } from "@nestjs/jwt";

// SIGN IN, LOGIN AND PASSWORD VERIFICATION, NEW TOKEN
@Controller()
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService, private jwtService: JwtService) {}

  //sign in with 42 : get url to authorize connexion to api 42
  @Get('/')
  async getUrl42() {
    const api_callback_url = encodeURIComponent(process.env.API_CALLBACK_URL);
    const url = "https://api.intra.42.fr/oauth/authorize?client_id=" + process.env.API_UID + "&redirect_uri=" + api_callback_url + "&response_type=code";
    return (url);
  }
  //exchange code send by api42 against token 42 to get user infos, if user unknow create in db
  //then generate access token to navigate on our website
  @Get('/callback')
  async callback(@Query('code') code: string) {
    const tokenApi42 = await this.authService.validateFortyTwo(code);
    const response = await fetch('https://api.intra.42.fr/v2/me/', {
      method: 'GET',
      headers: {
        'Authorization' : `Bearer ${tokenApi42}`,
      } 
    });
    const data = await response.json();
    if(!await this.userService.findByLogin(data.login)) {
      const newUser42 = {
        id: null,
        login: data.login,
        email: data.email,
        password: null,
        twoFactorSecret: null,
        isTwoFactorEnabled: null,
        qrCode: null,
      };
      console.log("create user42", newUser42);
      await this.userService.create(newUser42);
    }
    const access_token = await this.authService.genToken(data.login);
    return { 
      token: access_token,
      login: data.login,
    }
  }
  //check login and password with local stratgey of passport
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async isValidUser() {
    return (true);
  }
  //generate token when register or login
  @Post('auth/generateToken')
  async generateToken(@Body() data: UserDto) {
    const token = await this.authService.genToken(data.login);
    return token;
  }
  //enable authenticate with two factor (google authenticator)
  @UseGuards(JwtAuthGuard)
  @Post('auth/enable2fa')
  async enable2fa(@Headers('Authorization') token: string) {
    const user = await this.authService.decodeToken(token);
    const qrcode = await this.authService.generateQRcode(user.id);
    return {
      qrcode,
    }
  }
  //check if the code entered to activate 2fa is valid in settings
  @UseGuards(JwtAuthGuard)
  @Post('auth/verifyCodeSettings')
  async verifyCode2faSettings(@Body() data: VerifyCodeDto, @Headers('Authorization') token: string) {
    const userInfos = await this.authService.decodeToken(token);
    const user = await this.userService.findByLogin(userInfos.login);
    const isCodeValid = await this.authService.is2faCodeValid(data.code, user.twoFactorSecret);
    const is2faActive = await this.userService.turnOn2fa(user);
    return {
      is2faActive,
      isCodeValid,
    }
  }
  //check if the code entered is valid when signin and 2fa was activate in settings
  @Post('auth/verifyCode')
  async verifyCode2fa(@Body() data: VerifyCodeDto) {
    const user = await this.userService.findByLogin(data.login);
    const isCodeValid = await this.authService.is2faCodeValid(data.code, user.twoFactorSecret);
    const is2faActive = await this.userService.turnOn2fa(user);
    return {
      is2faActive,
      isCodeValid,
    }
  }
  //disable two factor authentication
  @UseGuards(JwtAuthGuard)
  @Post('auth/disable2fa')
  async disable2fa(@Headers('Authorization') token: string) {
    const user = await this.authService.decodeToken(token);
    const is2faActive = await this.userService.turnOff2fa(user.id);
    return {is2faActive};
  }
  //check if two factor auth is activate and generate qrcode in settings
  @UseGuards(JwtAuthGuard)
  @Post('auth/is2faActiveSettings')
  async is2faActiveSettings(@Body() user: UserDto) {
    const validUser = await this.userService.findByLogin(user.login);
    const is2faActive = validUser.isTwoFactorEnabled;
    const qrcode = validUser.qrCode;
    return {is2faActive, qrcode};
  }
  //check if two factor auth is active
  @Post('auth/is2faActive')
  async is2faActive(@Body() user: UserDto) {
    const validUser = await this.userService.findByLogin(user.login);
    const is2faActive = validUser.isTwoFactorEnabled;
    return {is2faActive};
  }
}