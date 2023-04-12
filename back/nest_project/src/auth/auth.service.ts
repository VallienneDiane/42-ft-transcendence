
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as qrcode from 'qrcode';
import * as speakeasy from 'speakeasy';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService, private jwtService: JwtService) {}

  //give to the api42 infos to get a token to access user infos
  async validateFortyTwo(code: string) {
    const response = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.API_UID,
        client_secret: process.env.API_KEY,
        code: code,
        redirect_uri: process.env.API_CALLBACK_URL,
      }),
    })
    const data = await response.json();
    console.log(data.access_token);
    return data.access_token;
  }

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
  
  async genToken(login: string){
    const validUser = await this.userService.findByLogin(login);
    const payload = {login: validUser.login, sub: validUser.id};
    return {
      access_token: this.jwtService.sign(payload)
    }
  }
  // TWO FACTOR AUTH | GOOGLE AUTHENTIFICATOR
  //otp auth = one time password compatible with Google authentificator
  async decodeToken(fullToken: string): Promise<{ id: string, login: string }>{
    const token = fullToken.split(' ')[1];
    const decodedToken = await this.jwtService.verifyAsync(token);
    const login = decodedToken.login;
    const id = decodedToken.sub;
    return { id, login };
  }
  //generate secret use for google authentificator
  //secret est une chaîne de caractères aléatoire qui est utilisée pour générer les codes d'authentification à deux facteurs.
  async generateQRcode(id: string) {
    const secretInfos = speakeasy.generateSecret( {
      name: "App Transcendence"
    });
    await this.userService.set2faSecret(secretInfos.ascii, id);
    const QRcode = await qrcode.toDataURL(secretInfos.otpauth_url);
    await this.userService.setQrCode(QRcode, id);
    return (QRcode);
  }
  //check if entered code for google authentificator is valid
  async is2faCodeValid(token: string, secret:string) {
    const isCodeValid = speakeasy.totp.verify(
    { 
      token,
      secret,
    });
    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }
    return (true);
  }
}
