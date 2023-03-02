
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from 'src/user/user.dto';
import { authenticator } from 'otplib';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import * as qrcode from 'qrcode';

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
  async genTwoFactorSecret(id: number, login: string) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(login, 'Transcendence', secret);
    await this.userService.setTwoFactorSecret(secret, id);
    return {
      secret,
      otpauthUrl,
    }
  }

  // generate QR code
  async generateQrCodeDataURL(secret: string) {
    const qrCode = await qrcode.toDataURL(secret);
    return qrCode;
  }

  //check if entered code for google authentificator is valid
  async isTwoFactorCodeValid(code: number, secret:string) {
    return authenticator.verify({token: String(code), secret: secret});
  }
}