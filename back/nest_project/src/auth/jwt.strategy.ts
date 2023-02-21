import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Injectable } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UserDto } from "src/user/user.dto";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.SECRET_KEY,
        })
    }
    // async validate(payload: any) {
    //     return {id: payload.sub, login: payload.login}
    //   }
    async validate(username: string, password: string): Promise<any> {
        
    }
}