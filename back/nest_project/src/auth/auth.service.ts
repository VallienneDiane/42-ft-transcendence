
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from 'src/user/user.dto';
import * as otplib from 'otplib';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import * as qrcode from 'qrcode';
import * as speakeasy from 'speakeasy';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService, private jwtService: JwtService) {}

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
    const validUser = await this.userService.findByLogin(user.login);
    const payload = {login: validUser.login, sub: validUser.id};
    return {
      access_token: this.jwtService.sign(payload)
    }
  }

  // TWO FACTOR AUTH | GOOGLE AUTHENTIFICATOR
  //otp auth = one time password compatible with Google authentificator

  async decodeToken(fullToken: string): Promise<{ id: number, login: string }>{
    const token = fullToken.split(' ')[1];
    const decodedToken = await this.jwtService.verifyAsync(token);
    const login = decodedToken.login;
    const id = decodedToken.sub;
    return { id, login };
  }
  //generate secret use for google authentificator
  //secret est une chaîne de caractères aléatoire qui est utilisée pour générer les codes d'authentification à deux facteurs.
  async genTwoFactorSecretOtpauthurl(id: number, login: string) {
    const secret = speakeasy.generateSecret( {
      name: "App Transcendence"
    });
    await this.userService.setTwoFactorSecret(secret.ascii, id);
    return (secret);

  }
  // generate QR code
  async generateQrCode(otpurl: string) {
    const qrCode = qrcode.toDataURL(otpurl);
    return qrCode;
  }
  //check if entered code for google authentificator is valid
  async isTwoFactorCodeValid(code: string, secret:string) {
    return speakeasy.totp.verify(
      { secret: secret,
        encoding: "ascii",
        token: code,
      });
  }
}
