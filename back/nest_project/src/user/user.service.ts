import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "./user.entity";

@Injectable({})
export class UserService {
    constructor (
        @InjectRepository(UserEntity)
        private usersRepository: Repository<UserEntity>,
    ) {}

    async create(newUser: UserEntity): Promise<UserEntity> {
        return await this.usersRepository.save(newUser);
    }
    
    async findAll(): Promise<UserEntity[]> {
        return await this.usersRepository.find();
    }
        
    async findOne(id: number): Promise<UserEntity> {
        return await this.usersRepository.findOneBy({id});
    }
            
    async update(id: number, User: UserEntity): Promise<void> {
        await this.usersRepository.update(id, User);
    }

    async delete(id: number): Promise<void> {
        await this.usersRepository.delete(id);
    }
}