import { Controller, Post, Get } from "@nestjs/common";
import { AuthService } from "./auth.service";
//controller needs to call the service and return if he can
//line 7 : call a constructor to instanciate an auth service class. Use dependency injection here. Equal to const authService = new AuthService()
@Controller('auth') // request to ../auth
export class AuthController {
    constructor(private authService: AuthService) {} 

    @Post('signup') // request to ../auth/signup
    signup() {
        console.log('salut');
        return this.authService.signup()
    }
    @Post('signin')
    signin() {
        return this.authService.signin()
    }
}