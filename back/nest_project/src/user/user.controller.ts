import { Controller, Post, Get, Body, Delete, Param, Patch, UseGuards, Headers, UsePipes, ValidationPipe, ParseUUIDPipe, ParseArrayPipe } from "@nestjs/common";
import { UserService } from "./user.service";
import { idDto, LoadAvatarDto, SignUp42Dto, SignUpDto, UpdateAvatarDto, UpdateLoginDto } from "./user.dto";
import { UserEntity } from "./user.entity";
import * as bcrypt from 'bcrypt';
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "../auth_strategies/jwt-auth.guard";
import { AuthService } from "src/auth/auth.service";
import { AvatarEntity } from "./avatar/avatar.entity";

/**
 * UseGuards()
 * Requests to database, access ok for validate user only !
 * use jwt strategy to check if token is valid before send back the user infos
 * 
 * UsePipes()
 * Activate dto
 */

@UsePipes(ValidationPipe)
@Controller()
export class UserController {
    constructor(
        private userService: UserService,
        private authService: AuthService,
        private jwtService: JwtService)
        {}
    /**
     * Create user account in db, hash password with bcrypt and generate token with jwtservice
     * @param newUser 
     * @returns 
     */
    @Post('user/signup') 
    async createUser(@Body() newUser: SignUpDto) {
        const saltOrRounds = 10;
        const hash = await bcrypt.hash(newUser.password, saltOrRounds);
        newUser.password = hash;
        const user = await this.userService.create(newUser);
        const payload = {sub: user.id};
        return {
            access_token: this.jwtService.sign(payload)
        }
    }
    /**
     * User sign up
     * @param newUser 
     * @returns 
     */
    @Post('user/signup42')
    async createUser42(@Body() newUser: SignUp42Dto) {
        const user42 = await this.userService.create42(newUser);
        return this.authService.genToken(user42.id);
    }
    /**
     * Update user
     * @param user 
     * @returns 
     */
    @UseGuards(JwtAuthGuard)
    @Post('user/updateLogin')
    async updateLogin(@Body() user: UpdateLoginDto) {
        const updatedLogin = await this.userService.updateLogin(user);
        return (updatedLogin);
    }
    /**
     * Update avatar
     * @param user 
     * @returns 
     */
    @UseGuards(JwtAuthGuard)
    @Post('user/updateAvatar')
    async updateAvatar(@Body() user: UpdateAvatarDto) {
        const updatedAvatar = await this.userService.updateAvatar(user);
        return (updatedAvatar);
    }
    /**
     * Check if login is unique
     * @param data 
     * @returns boolean
     */
    @Get('user/isUniqueLogin/:login')
    async isUniqueLogin(@Param('login') login: string):Promise<boolean> {
        const allLogins: {login: string;}[] = await this.userService.findAllLogins() as { login: string; }[];
        for(let i = 0; i < allLogins.length; i++) {
            if(login == allLogins[i].login) {
                return (false);
            }
        }
        return (true);
    }
    /**
     * Check if user 42 already know in the db
     * @param id42 
     * @returns boolean
     */
    @Get('user/isId42/:id42')
    async isId42(@Param('id42') id42: string):Promise<boolean> {
        const allIds42: {id42: string;}[] = await this.userService.findAllIds42() as { id42: string; }[];
        if(allIds42) {
            for(let i = 0; i < allIds42.length; i++) {
                if(id42 == allIds42[i].id42) {
                    return (true);
                }
            }
        }
        return (false);
    }
    /**
     * Get all users (login and id) of the db if valid token (use in chat for exemple)
     * @returns 
     */
    @UseGuards(JwtAuthGuard)
    @Get('users')
    async findAll(): Promise<any> {
        return await this.userService.findAll();
    }
    /**
     * Get profile of a user
     * @param data 
     * @returns 
     */
    @UseGuards(JwtAuthGuard)
    @Get('user/:id')
    async displayUserByLogin(@Param('id', ParseUUIDPipe) id: string): Promise<UserEntity> {
        return await this.userService.findById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('userWithAvatar/:id')
    async getUserWithAvatar(@Param('id', ParseUUIDPipe) id: string): Promise<{id: string, login: string, email: string, avatarSvg: AvatarEntity}> {
        console.log("id: ", id);
        return await this.userService.findByIdWithAvatar(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('userWithAvatarUsingLogin/:login')
    async getUserWithAvatarUsingLogin(@Param('login') login: string): Promise<{id: string, login: string, email: string, avatarSvg: AvatarEntity}> {
        console.log("login: ", login);
        return await this.userService.findByLoginWithAvatar(login);
    }

    /**
     * delete user account
     * @param data 
     * @returns 
     */
    @UseGuards(JwtAuthGuard)
    @Delete('user/:id')
    async delete(@Param('id') data: idDto) {
        return this.userService.delete(data.id);
    }
    /**
     * Get avatar in chat
     * @param data 
     * @returns 
     */
    @UseGuards(JwtAuthGuard)
    @Get('getAvatar/:user')
    async findAvatar(@Param('user', ParseUUIDPipe) id: string ): Promise<string> {
        return await this.userService.getAvatar(id);
    }
    // update avatar picture
    @UseGuards(JwtAuthGuard)
    @Post('user/uploadAvatar')
    async uploadAvatar(@Body() data: LoadAvatarDto): Promise<void> {
        return this.userService.loadAvatar(data.id, data.file);
    }
}