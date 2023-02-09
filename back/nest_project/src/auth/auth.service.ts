import { Body, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthDto } from "./auth.dto";
import { Repository } from "typeorm";
import { AuthEntity } from "./auth.entity";
import { AuthInterface } from "./auth.interface";

@Injectable({})
export class AuthService {
    public users: AuthDto[] = [];

    createUser(infosUser: AuthDto) {
        this.users.push(infosUser);
        return infosUser;
    }

    findAll(): AuthDto[] {
        return this.users;
    }
    // constructor(
    //     @InjectRepository(AuthEntity)
    //     private usersRepository: Repository<AuthEntity>,
    //   ) {}

    //   createUser(infosUser: AuthInterface) { 
    //     return this.usersRepository.create(infosUser);
    //   }
    
    //   findAll(@Body() infosUser: AuthDto): Promise<AuthEntity[]> {
    //     return this.usersRepository.find();
    //   }
    
    //   findOne(id: number): Promise<AuthEntity> {
    //     return this.usersRepository.findOneBy({ id });
    //   }
    
    //   async remove(id: string): Promise<void> {
    //     await this.usersRepository.delete(id);
    // }
}