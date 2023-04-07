import { Controller, Post, Get, Body, Delete, Param, Patch, UseGuards, Headers } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserDto } from "./user.dto";
import { UserEntity } from "./user.entity";
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "../auth_strategies/jwt-auth.guard";

// SIGN UP, REGISTER NEW USER IN DATABASE, NEW TOKEN
@Controller()
export class UserController {
    constructor(
        private userService: UserService,
        private jwtService: JwtService)
        {}

    //Create user account in db, hash password with bcrypt and generate token with jwtservice
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
    //Requests to database, access ok for validate user only !
        //use jwt strategy to check if token is valid before send back the user infos
        //get all users (login and id) of the db if valid token (use in chat for exemple)
    @UseGuards(JwtAuthGuard)
    @Get('users')
    async findAll(): Promise<any> {
        return await this.userService.findAll();
    }
    //get profile
    @UseGuards(JwtAuthGuard)
    @Get('user/:login')
    async displayUserByLogin(@Param('login') login: string): Promise<UserEntity> {
        return await this.userService.findByLogin(login);
    }
    //update account params
    @UseGuards(JwtAuthGuard)
    @Patch('user/:login')
    async update(@Param('login') login: string, @Body() user: UserDto): Promise<void> {
        return await this.userService.update(login, user);
    }
    //delete user account
    @UseGuards(JwtAuthGuard)
    @Delete('user/:login')
    async delete(@Param('login') login: string) {
        return this.userService.delete(login);
    }

    //update avatar picture
    @UseGuards(JwtAuthGuard)
    @Post('user/uploadAvatar')
    async uploadAvatar(@Body() data: {id: string, file: string}, @Headers('Authorization') token: string): Promise<void> {
        return this.userService.loadAvatar(data.id, data.file);
    }

    @UseGuards(JwtAuthGuard)
    @Get('getAvatar/:id')
    async findAvatar(@Param('id') id: string): Promise<string> {
        return this.userService.getAvatar(id);
    }
}