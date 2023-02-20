import { HttpException, HttpStatus, Injectable, Res } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
// import { Response } from 'express';
import { AuthDto } from './auth.dto';
import { UserDto } from 'src/user/user.dto';

@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService) {}

  async validateUser(login: string, password: string): Promise<AuthDto> {
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

  async loginJwt(user: UserDto) {
    const payload = { login: user.login, sub: user.id};

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
    // response.cookie('access_token', access_token, {httpOnly: true});
}