import { HttpException, HttpStatus, Injectable, Res } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from 'src/user/user.dto';

@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService) {}

  async validateUser(user: UserDto) {
    const userCheck = await this.userService.findByLogin(user.login);
    if(!userCheck) {
        throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }
    const passwdIsMatching = await bcrypt.compare(user.password, userCheck.password);
    if(!passwdIsMatching) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    const payload = {login: userCheck.login, sub: userCheck.id};    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}