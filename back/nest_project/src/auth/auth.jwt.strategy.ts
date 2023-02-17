import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UserDto } from 'src/user/user.dto';
import { AuthDto } from './auth.dto';

// Implement a passport-local strategy to authenticate the JSON web token. 
// By default, expects username and password properties in the request body.

// Then implement the validateUser() method, which the Passport middleware will call 
// to verify the user using an appropriate strategy-specific set of parameters.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SECRETKEY,
    });
  }
  async validateUser(login: string, password: string): Promise<AuthDto> {
    return await this.authService.validateUserInfos(login, password);
  }

  async validate(payload: JwtPayload): Promise<UserDto> {
    const user = await this.authService.validateUser(payload);
    if (!user) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);    
    }    
    return user;  
}
}