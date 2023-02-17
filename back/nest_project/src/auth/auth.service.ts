import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async validateUserInfos(login: string, password: string) {
    const user = await this.userService.findByLogin(login);
    if(!user) {
        throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }
    const passwdIsMatching = await bcrypt.compare(password, user.password);
    if(!passwdIsMatching) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  async login(user: any)
  {
    const payload = {login: user.login, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    }
  }
}