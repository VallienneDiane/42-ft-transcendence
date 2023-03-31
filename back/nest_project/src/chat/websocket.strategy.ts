import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Injectable } from "@nestjs/common";

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    // console.log('SECRET', process.env.SECRET);
        super({
            usernameField: 'login',
            jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("token"),
            ignoreExpiration: false,
            secretOrKey: process.env.SECRET,
        })
    }
    async validate(payload: any) {
        return { id: payload.sub, login: payload.login};
    }
}

