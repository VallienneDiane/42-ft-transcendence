import { Controller, Post, Get, Body, Delete, Param, Patch, UseGuards, Headers, UsePipes, ValidationPipe } from "@nestjs/common";
import { UserService } from "./user.service";
import { SignUp42Dto, SignUpDto, UpdateAvatarDto, UpdateLoginDto } from "./user.dto";
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
        console.log("(user.controller) user/signup, user create = ", user);
        const payload = {sub: user.id};
        return {
            access_token: this.jwtService.sign(payload)
        }
    }
    
    @Post('user/signup42')
    async createUser42(@Body() newUser: SignUp42Dto) {
        const user42 = await this.userService.create42(newUser);
        return this.authService.genToken(user42.id);
    }
    
    @UseGuards(JwtAuthGuard)
    @Post('user/updateLogin')
    async updateLogin(@Body() user: UpdateLoginDto) {
        const updatedLogin = await this.userService.updateLogin(user);
        return (updatedLogin);
    }
    
    @UseGuards(JwtAuthGuard)
    @Post('user/updateAvatar')
    async updateAvatar(@Body() user: UpdateAvatarDto) {
        console.log("(user controller) USER update avatar ", user);
        const updatedAvatar = await this.userService.updateAvatar(user);
        return (updatedAvatar);
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
    async isId42(@Param('id42') id42: string):Promise<boolean> {
        const allIds42: {id42: string;}[] = await this.userService.findAllIds42() as { id42: string; }[];
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
    @Get('user/:id')
    async displayUserByLogin(@Param('id') id: string): Promise<UserEntity> {
        return await this.userService.findById(id);
    }
    //update account params
    // @UseGuards(JwtAuthGuard)
    // @Patch('user/:login')
    // async update(@Param('login') login: string, @Body() user: UserDto): Promise<void> {
    //     return await this.userService.update(login, user);
    // }
    //delete user account
    @UseGuards(JwtAuthGuard)
    @Delete('user/:id')
    async delete(@Param('id') id: string) {
        return this.userService.delete(id);
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