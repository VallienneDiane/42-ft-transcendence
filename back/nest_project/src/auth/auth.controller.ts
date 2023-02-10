import { Controller, Post, Get, Body, Delete, Param, Patch } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto } from "./auth.dto";
import { AuthEntity } from "./auth.entity";
//controller needs to call the service and return if he can
//call a constructor to instanciate an auth service class. Use dependency injection here. Equal to const authService = new AuthService()

@Controller('auth') // request to ../auth
export class AuthController {
    constructor(private authService: AuthService) {} 

    @Post()
    create(@Body() newUser: AuthDto) {
        return this.authService.create(newUser);
    }
    
    @Get()
    async findAll(): Promise<AuthEntity[]> {
        return await this.authService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<AuthEntity> {
        return await this.authService.findOne(+id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() user: AuthDto): Promise<void> {
        return await this.authService.update(+id, user); //+id = cast in number or Number(id)
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.authService.delete(+id);
    }
}