import axios from "axios";
import { Controller, Body, Request, Post, Get, UseGuards, UnauthorizedException, Req, Headers, Res, Query, Redirect } from '@nestjs/common';
import { JwtAuthGuard } from '../auth_strategies/jwt-auth.guard';
import { UserDto } from 'src/user/user.dto';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../auth_strategies/local-auth.guard';
import { VerifyCodeDto } from './verifyCode.dto';
import { FortyTwoGuard } from '../auth_strategies/42-auth.guard';
import { Response } from 'express';
import { JwtService } from "@nestjs/jwt";

// SIGN IN, LOGIN AND PASSWORD VERIFICATION, NEW TOKEN
@Controller()
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService, private jwtService: JwtService) {}

  @Get('/')
  async getUrl42() {
    const api_callback_url = encodeURIComponent(process.env.API_CALLBACK_URL);
    const url = "https://api.intra.42.fr/oauth/authorize?client_id=" + process.env.API_UID + "&redirect_uri=" + api_callback_url + "&response_type=code";
    return (url);
  }
  
  @Get('/callback')
  async callback(@Query('code') code: string) {
    const token = await this.authService.validateFortyTwo(code);
    console.log("controller : token = ", token);
    const response = await fetch('https://api.intra.42.fr/v2/me/', {
      method: 'GET',
      headers: {
        'Authorization' : `Bearer ${token}`,
      } 
    });
    const data = await response.json();

    if(!this.userService.findByLogin(data.login)) {
      const newUser42 = {
        id: null,
        login: data.login,
        email: data.email,
        password: null,
        twoFactorSecret: null,
        isTwoFactorEnabled: null,
        qrCode: null,
      }
      await this.userService.create(newUser42);
    }
    // this.generateToken(data);
    const payload = {login: data.login};
    return {
      access_token: this.jwtService.sign(payload)
    }
  }

  //check login and password with stratgey local of passport and generate token
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

  @UseGuards(JwtAuthGuard)
  @Post('auth/enable2fa')
  async enable2fa(@Headers('Authorization') token: string) {
    const user = await this.authService.decodeToken(token);
    const qrcode = await this.authService.generateQRcode(user.id);
    return {
      qrcode,
    }
  }
  
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
  
  @UseGuards(JwtAuthGuard)
  @Post('auth/disable2fa')
  async disable2fa(@Headers('Authorization') token: string) {
    const user = await this.authService.decodeToken(token);
    const is2faActive = await this.userService.turnOff2fa(user.id);
    return {is2faActive};
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('auth/is2faActiveSettings')
  async is2faActiveSettings(@Body() user: UserDto) {
    const validUser = await this.userService.findByLogin(user.login);
    const is2faActive = validUser.isTwoFactorEnabled;
    const qrcode = validUser.qrCode;
    return {is2faActive, qrcode};
  }

  @Post('auth/is2faActive')
  async is2faActive(@Body() user: UserDto) {
    const validUser = await this.userService.findByLogin(user.login);
    const is2faActive = validUser.isTwoFactorEnabled;
    return {is2faActive};
  }
}