import { Controller, Post, Get, Body, Delete, Param, Patch, UseGuards } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserDto } from "./user.dto";
import { UserEntity } from "./user.entity";
import * as bcrypt from 'bcrypt';
import { AuthGuard } from "@nestjs/passport";
import { JwtService } from "@nestjs/jwt";

// SIGN UP, REGISTER NEW USER IN DATABASE, NEW TOKEN
@Controller()
export class UserController {
    constructor(
        private userService: UserService,
        private jwtService: JwtService)
        {}

    //create user account in db and generate token
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
    //get all users
    @UseGuards(AuthGuard('jwt'))
    @Get('users')
    async findAll(): Promise<UserEntity[]> {
        return await this.userService.findAll();
    }
    //get profile
    @UseGuards(AuthGuard('jwt'))
    @Get('user/:login')
    async displayUserByLogin(@Param('login') login: string): Promise<UserEntity> {
        return await this.userService.findByLogin(login);
    }
    //update account params
    @UseGuards(AuthGuard('jwt'))
    @Patch('user/:login')
    async update(@Param('login') login: string, @Body() user: UserDto): Promise<void> {
        return await this.userService.update(login, user);
    }
    //delete user account
    @UseGuards(AuthGuard('jwt'))
    @Delete('user/:login')
    async delete(@Param('login') login: string) {
        return this.userService.delete(login);
    }
}