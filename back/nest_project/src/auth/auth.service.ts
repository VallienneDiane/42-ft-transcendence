import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthDto } from "./auth.dto";
import { Repository } from "typeorm";
import { AuthEntity } from "./auth.entity";

@Injectable({})
export class AuthService {
    constructor(
        @InjectRepository(AuthEntity)
        private usersRepository: Repository<AuthEntity>,
      ) {}

    async create(newUser: AuthEntity): Promise<AuthEntity> { 
        return await this.usersRepository.save(newUser);
    }
    
    async findAll(): Promise<AuthEntity[]> {
        return await this.usersRepository.find();
    }
        
    async findOne(id: number): Promise<AuthEntity> {
        return await this.usersRepository.findOneBy({id});
    }
            
    async update(id: number, auth: AuthEntity): Promise<void> {
        await this.usersRepository.update(id, auth);
    }

    async delete(id: number): Promise<void> {
        await this.usersRepository.delete(id);
    }
}