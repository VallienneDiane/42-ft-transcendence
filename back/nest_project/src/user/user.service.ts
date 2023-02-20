import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserDto } from "./user.dto";
import { UserEntity } from "./user.entity";

@Injectable({})
export class UserService {
    constructor (
        @InjectRepository(UserEntity)
        private readonly usersRepository: Repository<UserEntity>
    ) {}
    // SIGN UP : CREATE NEW USER AND SAVE IT IN THE DATABASE
    async create(newUser: UserEntity): Promise<UserEntity> {
        return await this.usersRepository.save(newUser);
    }
    // SIGN IN OR DISPLAY ONE USER PROFILE BY LOGIN
    async findByLogin(login: string): Promise<UserDto> {
        return await this.usersRepository.findOneBy({login});
    }
    
    // DISPLAY ALL USERS
    async findAll(): Promise<UserEntity[]> {
        return await this.usersRepository.find();
    }
    // UPDATE USER INFOS
    async update(login: string, User: UserEntity): Promise<void> {
        await this.usersRepository.update(login, User);
    }
    // DELETE USER ACCOUNT BY ID
    async delete(login: string): Promise<void> {
        await this.usersRepository.delete(login);
    }
}