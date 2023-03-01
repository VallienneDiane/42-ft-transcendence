
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as qrcode from 'qrcode';
import { UserDto } from 'src/user/user.dto';
import { authenticator } from 'otplib';

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
    await this.userService.setTwoFactorSecret(secret, user.id);
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

  async isTwoFactorCodeValid(code: string, secret:string) {
    const verification = authenticator.verify({token: code, secret: secret});
    console.log("je suis dans la fonction qui valide le code saisi");
    return verification;
  }
}