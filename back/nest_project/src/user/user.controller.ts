import { Controller, Post, Get, Body, Delete, Param, Patch, UseGuards, Headers, UsePipes, ValidationPipe } from "@nestjs/common";
import { UserService } from "./user.service";
import { SignUp42Dto, SignUpDto, UserDto } from "./user.dto";
import { UserEntity } from "./user.entity";
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "../auth_strategies/jwt-auth.guard";
import { AuthService } from "src/auth/auth.service";
import { normalize } from "path";

// SIGN UP, REGISTER NEW USER IN DATABASE, NEW TOKEN
@UsePipes(ValidationPipe)
@Controller()
export class UserController {
    constructor(
        private userService: UserService,
        private authService: AuthService,
        private jwtService: JwtService)
        {}

    //Create user account in db, hash password with bcrypt and generate token with jwtservice
    @Post('user/signup') 
    async createUser(@Body() newUser: SignUpDto) {
        const saltOrRounds = 10;
        const hash = await bcrypt.hash(newUser.password, saltOrRounds);
        newUser.password = hash;
        const user = await this.userService.create(newUser);
        console.log("user = ", user);
        const payload = {login: user.login, sub: user.id};
        console.log("user: ", newUser);
        return {
            access_token: this.jwtService.sign(payload)
        }
    }

    @Post('user/signup42')
    async createUser42(@Body() newUser: SignUp42Dto) {
        console.log("usercontroller: user/create newUser ", newUser);
        const user = await this.userService.create42(newUser);
        console.log("user create = " , user);
        const token = this.authService.genToken(newUser.login);
        return token;
    }
  
    @Get('user/isUniqueLogin/:login')
    async isUniqueLogin(@Param('login') login: string):Promise<boolean> {
        const allLogins: {login: string;}[] = await this.userService.findAllLogins() as { login: string; }[];
        console.log("allLogins = ", allLogins);
        for(let i = 0; i < allLogins.length; i++) {
            if(login == allLogins[i].login) {
                return (false);
            }
        }
        return (true);
    }
    
    @Get('user/isId42/:id42')
    async isId42(@Param('id42') id42: number):Promise<boolean> {
        const allIds42: {id42: number;}[] = await this.userService.findAllIds42() as { id42: number; }[];
        console.log("allIds42 = ", allIds42);
        if(allIds42) {
            for(let i = 0; i < allIds42.length; i++) {
                if(id42 == allIds42[i].id42) {
                    return (true);
                }
            }
        }
        return (false);
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
    @Get('getAvatar/:user')
    async findAvatar(@Param('user') userId: string): Promise<string> {
        return await this.userService.getAvatar(userId);
    }
}