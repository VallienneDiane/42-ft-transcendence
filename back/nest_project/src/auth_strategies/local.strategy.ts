import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Dependencies } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

@Injectable()
@Dependencies(AuthService)
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'login'});
  }
  async validate(login: string, password: string) {
    const user = await this.authService.validateUser(login, password);
    if (!user) {
        throw new UnauthorizedException();
    }
    return user;
  }
}