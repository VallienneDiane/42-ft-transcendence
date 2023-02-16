import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthDto } from "src/auth/auth.dto";
import { Repository } from "typeorm";
import { UserEntity } from "./user.entity";
import * as bcrypt from 'bcrypt';

@Injectable({})
export class UserService {
    constructor (
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>
    ) {}
    // SIGN UP : CREATE NEW USER AND SAVE IT IN THE DATABASE
    async create(newUser: UserEntity): Promise<UserEntity> {
        return await this.usersRepository.save(newUser);
    }
    // SIGN IN : CHECK IF ENTERED PASSWORD AND DATABASE HASHED PASSWORD ARE MATCHING
    async validateUser(login: string , password: string): Promise<AuthDto> {
        const user= await this.usersRepository.findOneBy({login});
        if(!user) {
            throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
        }
        const passwdIsMatching = await bcrypt.compare(password, user.password);
        if(!passwdIsMatching) {
            throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
        }
        return user;
    }
    // DISPLAY ALL USERS
    async findAll(): Promise<UserEntity[]> {
        return await this.usersRepository.find();
    }
    // DISPLAY ONE USER PROFILE BY ID
    async findById(id: number): Promise<UserEntity> {
        return await this.usersRepository.findOneBy({id});
    }
    // // DISPLAY ONE USER PROFILE BY LOGIN
    async findByLogin(login: string): Promise<UserEntity> {
        const user = await this.usersRepository.findOne({ where: {login} });
        return user;
    }
    // UPDATE USER INFOS
    async update(id: number, User: UserEntity): Promise<void> {
        await this.usersRepository.update(id, User);
    }
    // DELETE USER ACCOUNT BY ID
    async delete(id: number): Promise<void> {
        await this.usersRepository.delete(id);
    }
}