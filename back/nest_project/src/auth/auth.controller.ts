import { Controller, Body, Post, Get, UseGuards, Headers, Query, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../auth_strategies/jwt-auth.guard';
import { id42Dto, idDto, LoginDto, VerifyCodeDto, VerifyCodeDto42 } from 'src/user/user.dto';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../auth_strategies/local-auth.guard';

@Controller()
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) { }
  /**
   * Sign in with 42 : get url to authorize connexion to the api 42
   * @returns url
   */
  @Get('/')
  async getUrl42() {
    const api_callback_url = encodeURIComponent(process.env.API_CALLBACK_URL);
    const url = "https://api.intra.42.fr/oauth/authorize?client_id=" + process.env.API_UID + "&redirect_uri=" + api_callback_url + "&response_type=code";
    return (url);
  }
  /**
   * Exchange code send by api42 (in url) against token 42 to get user42 infos
   * @param code 
   * @returns infos user42
   */
  @Get('/callback')
  async callback(@Query('code') code: string) {
    const tokenApi42 = await this.authService.validateFortyTwo(code);
    const response = await fetch('https://api.intra.42.fr/v2/me/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenApi42}`,
      }
    });
    const data = await response.json();
    return {
      id42: data.id,
      login: data.login,
      email: data.email,
      avatarSvg: data.image?.link,
    }
  }
  /**
   * Check login and password with local strategy of Passport and return true if UseGuards says that login and passwd match data in bdd
   * @returns true
   */
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async isValidUser(@Body() data: LoginDto) {
    const user = await this.userService.findByLogin(data.login);
    return (user);
  }
  /**
   * Generate a jwt token when register or login successfully
   * @param data 
   * @returns token
   */
  @Post('auth/generateToken')
  async generateToken(@Body() data: idDto) {
    const token = await this.authService.genToken(data.id);
    return token;
  }
  @Post('auth/generateToken42')
  async generateToken42(@Body() data: id42Dto) {
    const token = await this.authService.genToken42(data.id42);
    return token;
  }
  /**
   * Enable authenticate with two factor (google authenticator)
   * @param token 
   * @returns qrcode
   */
  @UseGuards(JwtAuthGuard)
  @Post('auth/enable2fa')
  async enable2fa(@Headers('Authorization') token: string) {
    const user = await this.authService.decodeToken(token);
    const qrcode = await this.authService.generateQRcode(user.id);
    return {
      qrcode,
    }
  }
  /**
   * Check if the code entered to activate 2fa is valid when configure settings
   * @param data (code)
   * @param token 
   * @returns is2faActive, isCodeValid
   */
  @UseGuards(JwtAuthGuard)
  @Post('auth/verifyCodeSettings')
  async verifyCode2faSettings(@Body() data: VerifyCodeDto, @Headers('Authorization') token: string) {
    const userInfos = await this.authService.decodeToken(token);
    const user = await this.userService.findById(userInfos.id);
    const isCodeValid = await this.authService.is2faCodeValid(data.code, user.twoFactorSecret);
    const is2faActive = await this.userService.turnOn2fa(user);
    return {
      is2faActive,
      isCodeValid,
    }
  }
  /**
   * Check if the code entered is valid when signin and 2fa was activate in settings
   * @param data 
   * @returns 
   */
  @Post('auth/verifyCode')
  async verifyCode2fa(@Body() data: VerifyCodeDto) {
    const user = await this.userService.findById(data.id);
    const isCodeValid = await this.authService.is2faCodeValid(data.code, user.twoFactorSecret);
    const is2faActive = await this.userService.turnOn2fa(user);
    return {
      is2faActive,
      isCodeValid,
    }
  }
  /**
   * Check if two factor auth is activate and generate qrcode in settings
  */
  @UseGuards(JwtAuthGuard)
  @Post('auth/is2faActiveSettings')
  async is2faActiveSettings(@Body() data: idDto) {
    const validUser = await this.userService.findById(data.id);
    if (!validUser)
      return {};
    const is2faActive = validUser.isTwoFactorEnabled;
    const qrcode = validUser.qrCode;
    return { is2faActive, qrcode };
  }
  /**
   * Check if two factor auth is active
   * @param data 
   * @returns 
  */
  @Post('auth/is2faActive')
  async is2faActive(@Body() data: idDto) {
    const validUser = await this.userService.findById(data.id);
    const is2faActive = validUser.isTwoFactorEnabled;
    return { is2faActive };
  }
  /**
   * Disable two factor authentication
   * @param token 
   * @returns 
   */
  @UseGuards(JwtAuthGuard)
  @Post('auth/disable2fa')
  async disable2fa(@Headers('Authorization') token: string) {
    const user = await this.authService.decodeToken(token);
    const is2faActive = await this.userService.turnOff2fa(user.id);
    return { is2faActive };
  }
  @Post('auth/is2faActive42')
  async is2faActive42(@Body() data: id42Dto) {
    const validUser = await this.userService.findById42(data.id42);
    const is2faActive = validUser.isTwoFactorEnabled;
    return {
      id: validUser.id,
      is2faActive: is2faActive,
    };
  }
}