import { Injectable } from "@nestjs/common";

@Injectable({})
export class AuthService {
    signup() {
        return { msg: 'SIGN UP'};
    }
    signin() {
        return { msg: 'SIGN IN'};
    }
}