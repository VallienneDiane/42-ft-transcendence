import { Controller, Post, Get, Body, Delete, Param, Patch, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserDto } from "./user.dto";
import { UserEntity } from "./user.entity";
import * as bcrypt from 'bcrypt';
import { AuthGuard } from "@nestjs/passport";
import { JwtService } from "@nestjs/jwt";

// SIGN UP AND REGISTER USER IN DATABASE
// GENERATE TOKEN FOR THIS NEW USER
@Controller()
export class UserController {
    constructor(
        private userService: UserService, 
        private jwtService: JwtService) 
        {}

    // CREATE USER ACCOUNT, SEND POST REQUEST AND HASH THE PASSWORD WHEN REGISTER
    @Post('user/signup') 
    async create(@Body() newUser: UserDto) {
        const saltOrRounds = 10;
        const hash = await bcrypt.hash(newUser.password, saltOrRounds);
        newUser.password = hash;
        await this.userService.create(newUser);
        const payload = {login: newUser.login, sub: newUser.id};
        return {
            access_token: this.jwtService.sign(payload)
        }
    }
    // GET ALL USERS
    @UseGuards(AuthGuard('jwt'))
    @Get()
    async findAll(): Promise<UserEntity[]> {
        return await this.userService.findAll();
    }
    // GET ONE USER BY LOGIN
    @Get(':login')
    async displayUserByLogin(@Param('login') login: string): Promise<UserEntity> {
        return await this.userService.findByLogin(login);
    }

    @Patch(':login')
    async update(@Param('login') login: string, @Body() user: UserDto): Promise<void> {
        return await this.userService.update(login, user); //+id = cast in number or Number(id)
    }

    @Delete('login')
    async delete(@Param('login') login: string) {
        return this.userService.delete(login);
    }
}