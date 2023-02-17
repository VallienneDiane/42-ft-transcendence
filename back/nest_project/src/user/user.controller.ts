import { Controller, Post, Get, Body, Delete, Param, Patch, HttpStatus, HttpException } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserDto } from "./user.dto";
import { UserEntity } from "./user.entity";
import * as bcrypt from 'bcrypt';
import { AuthDto } from "src/auth/auth.dto";

@Controller('user')
export class UserController {
    constructor(private userService: UserService) {} //instanciate an user service class (dependency injection) ~ to const userService = new userService()

    // POST REQUEST TO CREATE USER ACCOUNT
    @Post() // localhost:3000/user
    async create(@Body() newUser: UserDto) {
        const saltOrRounds = 10;
        const hash = await bcrypt.hash(newUser.password, saltOrRounds);
        newUser.password = hash;
        return this.userService.create(newUser);
    }
    // POST REQUEST TO SIGN IN THE WEBSITE
    @Post(':login') // localhost:3000/user/login
    async validate(@Body() checkUser: AuthDto) {
        return this.userService.validateUser(checkUser.login, checkUser.password);
    }
    // GET ALL USERS
    @Get()
    async findAll(): Promise<UserEntity[]> {
        return await this.userService.findAll();
    }
    // GET ONE USER BY LOGIN
    @Get(':login')
    async displayUserByLogin(@Param('login') login: string): Promise<UserEntity> {
        console.log("coucou");
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