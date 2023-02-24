
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as speakeasy from "speakeasy";

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

  //otp = one time password
  async genTwoFactorSecretCode() {
    const secretCode = speakeasy.generateSecret({
      name: process.env.TWOFACTOR_APP_NAME,
    });
    return {
      otpauthUrl: secretCode.otpauth_url,
      base32: secretCode.base32,
    }
  }
}