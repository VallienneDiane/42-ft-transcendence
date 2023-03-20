import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserDto } from "./user.dto";
import { UserEntity } from "./user.entity";

interface User {
    id: number,
    login: string,
    email: string,
    twoFactorSecret: string,
    isTwoFactorEnabled: boolean,
    qrCode: string,
}

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
    // SIGN IN OR DISPLAY ONE USER PROFILE BY LOGIN
    public findById(id: number): Promise<UserDto> {
        return this.usersRepository.findOneBy({id});
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
    async set2faSecret(secret: string, id: number) {
        const user = await this.usersRepository.findOneBy({id});
        user.twoFactorSecret = secret;
        await this.usersRepository.save(user);
        return (user.twoFactorSecret);
    }
    //set secret code for 2fa in user entity
    async setQrCode(qrcode: string, id: number) {
        const user = await this.usersRepository.findOneBy({id});
        user.qrCode = qrcode;
        await this.usersRepository.save(user);
        return (user.qrCode);
    }
    //the user turned on the 2fa
    async turnOn2fa(user: User) {
        user.isTwoFactorEnabled = true;
        await this.usersRepository.save(user); //save value of param isTwoFactorEnabled in db
        return (user.isTwoFactorEnabled);
    }
    //the user turned off the 2fa
    async turnOff2fa(id: number) {
        const user = await this.usersRepository.findOneBy({id});
        user.isTwoFactorEnabled = false;
        await this.usersRepository.save(user);
        return (user.isTwoFactorEnabled);
    }
}