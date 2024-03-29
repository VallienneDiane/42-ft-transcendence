import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Injectable } from "@nestjs/common";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
        super({
            usernameField: 'login',
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.SECRET,
        })
    }
    async validate(payload: any) {
        return { id: payload.sub, login: payload.login };
    }
}
