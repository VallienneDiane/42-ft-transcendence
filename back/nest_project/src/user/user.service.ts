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
    public create(newUser: UserEntity): Promise<UserEntity> {
        return this.usersRepository.save(newUser);
    }
    // SIGN IN OR DISPLAY ONE USER PROFILE BY LOGIN
    public findByLogin(login: string): Promise<UserDto> {
        return this.usersRepository.findOneBy({login});
    }
    // DISPLAY ALL USERS
    async findAll(): Promise<{ id: number, login: string }[]> {
        return await this.usersRepository.createQueryBuilder('user')
          .select(['user.id', 'user.login'])
          .getMany();
    }
    // UPDATE USER INFOS
    async update(login: string, User: UserEntity): Promise<void> {
        this.usersRepository.update(login, User);
    }
    // DELETE USER ACCOUNT BY ID
    async delete(login: string): Promise<void> {
        this.usersRepository.delete(login);
    }
    //set secret code for 2fa in user entity
    async setTwoFactorAuthSecret(secret: string, id: number) {
        const user = await this.usersRepository.findOneBy({id});
        user.twoFactorSecret = secret;
        console.log("SET code secret : ", user.twoFactorSecret);
    }
    //the user turned on the 2fa
    async turnOnTwoFactor(id: number) {
        console.log("turn ON two factors to TRUE ");
        const user = await this.usersRepository.findOneBy({id});
        user.isTwoFactorEnabled = true;
        console.log(user.isTwoFactorEnabled);
    }
    //the user turned off the 2fa
    async turnOffTwoFactor(id: number) {
        console.log("turn OFF two factors to FALSE ");
        const user = await this.usersRepository.findOneBy({id});
        user.isTwoFactorEnabled = false;
        console.log(user.isTwoFactorEnabled);
    }
}