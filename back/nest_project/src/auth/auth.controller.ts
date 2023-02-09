import { Controller, Post, Get, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto } from "./auth.dto";
//controller needs to call the service and return if he can
//call a constructor to instanciate an auth service class. Use dependency injection here. Equal to const authService = new AuthService()
@Controller('auth') // request to ../auth
export class AuthController {
    constructor(private authService: AuthService) {} 

    @Post('addUser')
    create(@Body() infosUser: AuthDto) {
        return this.authService.createUser(infosUser);
    }
    
    @Get('displayUser') // request to ../auth/displayUser
    async findAll(): Promise<any[]> {
        return [];
    }
}