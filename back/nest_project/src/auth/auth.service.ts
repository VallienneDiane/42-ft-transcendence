
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
  /**
   * Give to the api42 infos to get a token to access user infos
   * @param code 
   * @returns token
   */
  async validateFortyTwo(code: string) {
    try {
      const body = JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.API_UID,
        client_secret: process.env.API_KEY,
        code,
        redirect_uri: process.env.API_CALLBACK_URL,
      });
      const response = await fetch(`https://api.intra.42.fr/oauth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const data = await response.json();
      return data.access_token;
    }
    catch(error) {
      throw error;
    }
  }
  /**
   * Validate user infos when login
   * @param login 
   * @param password 
   * @returns userEntity
   */
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
  /**
   * Generate token
   * @param id 
   * @returns 
   */
  async genToken(id: string){
    const validUser = await this.userService.findById(id);
    const payload = {sub: validUser.id};
    return {
      access_token: this.jwtService.sign(payload)
    }
  }

  async genToken42(id42: string){
    const validUser = await this.userService.findById42(id42);
    const payload = {sub: validUser.id};
    return {
      access_token: this.jwtService.sign(payload)
    }
  }
  /**
   * TWO FACTOR AUTH | GOOGLE AUTHENTIFICATOR
   * otp auth = one time password compatible with Google authentificator
   * @param fullToken 
   * @returns 
   */
  async decodeToken(fullToken: string): Promise<{ id: string }>{
    const token = fullToken.split(' ')[1];
    const decodedToken = await this.jwtService.verifyAsync(token);
    const id = decodedToken.sub;
    return { id };
  }
  /**
   * Generate secret use for google authentificator
   * secret = random string use to generate two factor authentication codes
   * @param id 
   * @returns 
   */
  async generateQRcode(id: string) {
    const secretInfos = speakeasy.generateSecret( {
      name: "ft_Transcendence"
    });
    await this.userService.set2faSecret(secretInfos.ascii, id);
    const QRcode = await qrcode.toDataURL(secretInfos.otpauth_url);
    await this.userService.setQrCode(QRcode, id);
    return (QRcode);
  }
  /**
   * Check if entered code for google authentificator is valid
   * @param token 
   * @param secret 
   * @returns 
   */
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
