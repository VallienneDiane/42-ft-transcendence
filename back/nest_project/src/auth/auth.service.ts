
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';
import { UserDto } from 'src/user/user.dto';
import { authenticator } from 'otplib';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService, 
    private jwtService: JwtService) {}

  async validateUser(login: string, password: string) {
    const validUser = await this.userService.findByLogin(login);
    if(!validUser) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }
    const passwdIsMatching = await bcrypt.compare(password, validUser.password);
    if(!passwdIsMatching) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return validUser;
  }

  async login(user: any){
    const payload = {login: user.login, sub: user.id};
    return {
      access_token: this.jwtService.sign(payload)
    }
  }

  // TWO FACTOR AUTH | GOOGLE AUTHENTIFICATOR

  //otp auth = one time password compatible with Google authentificator
  async genTwoFactorSecret(user: UserDto) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.login, 'Transcendence', secret);
    await this.userService.setTwoFactorAuthSecret(secret, user.id);
    console.log("secret code : ", secret);
    console.log("otp url : ", otpauthUrl);
    user.twoFactorSecret = secret;
    return {
      secret,
      otpauthUrl,
    }
  }

  // generate QR code
  async generateQrCodeDataURL(otpauthUrl: string) {
    console.log("GENERATE QR code");
    return QRCode.toDataURL(otpauthUrl);
  }

  async isTwoFactorCodeValid(twoFactorSecret: string, user: UserDto) {
    console.log("VALIDATE TWO FACTOR SECRET");
    console.log("twofactosecret : ", twoFactorSecret);
    console.log("secret : ", user.twoFactorSecret);
    return authenticator.verify({
      token: twoFactorSecret,
      secret: user.twoFactorSecret,
    })
  }



}