import { Controller, Post, Get, Body, Delete, Param, Patch } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserDto } from "./user.dto";
import { UserEntity } from "./user.entity";
import * as bcrypt from 'bcrypt';

@Controller('user') // localhost:3000/user
export class UserController {
    constructor(private userService: UserService) {} //instanciate an user service class (dependency injection) ~ to const userService = new userService()

    @Post('signup') // localhost:3000/user/signup
    async create(@Body() newUser: UserDto) {
        const saltOrRounds = 10;
        const hash = await bcrypt.hash(newUser.password, saltOrRounds);
        newUser.password = hash;
        return this.userService.create(newUser);
    }
    
    @Get()
    async findAll(): Promise<UserEntity[]> {
        return await this.userService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<UserEntity> {
        return await this.userService.findOne(+id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() user: UserDto): Promise<void> {
        return await this.userService.update(+id, user); //+id = cast in number or Number(id)
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.userService.delete(+id);
    }
}