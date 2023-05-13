import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ChannelEntity } from "../chat/channel/channel.entity";
import { Repository } from "typeorm";
import { SignUp42Dto, SignUpDto, UpdateAvatarDto, UpdateLoginDto } from "./user.dto";
import { UserEntity } from "./user.entity";
import { IRequest } from "src/chat/chat.interface";
import { AvatarService } from "./avatar/avatar.service";
import { AvatarEntity } from "./avatar/avatar.entity";

@Injectable({})
export class UserService {
    constructor (
        @InjectRepository(UserEntity)
        private readonly usersRepository: Repository<UserEntity>,
        @Inject(AvatarService)
        private readonly avatarService: AvatarService
    ) {}
    /**
     * Create new user and save it in database
     * @param newUser 
     * @returns UserEntity
     */
    async create(newUser: SignUpDto): Promise<UserEntity> {
        const avatar: AvatarEntity = await this.avatarService.create(newUser.avatarSvg);
        const user: UserEntity = {
            id: undefined,
            id42: null,
            login: newUser.login,
            email: newUser.email,
            password: newUser.password,
            channelsAsNormal: [],
            channelsAsOp: [],
            channelsAsGod: [],
            channelsAsBanned: [],
            messagesReceived: [],
            messagesSend: [],
            messagesChannel: [],
            twoFactorSecret: null,
            isTwoFactorEnabled: false,
            qrCode: null,
            avatarSvg: avatar,
            requestsSend: [],
            requestsReceived: [],
            blockList: [],
            blockedMeList: [],
            mutedList: [],
            wonMatches: [],
            lostMatches: [],
        }
        return await this.usersRepository.save(user);
    }
    async create42(newUser: SignUp42Dto): Promise<UserEntity> {
        const avatar: AvatarEntity = await this.avatarService.create(newUser.avatarSvg);
        const user: UserEntity = {
            id: undefined,
            id42: newUser.id42,
            login: newUser.login,
            email: newUser.email,
            password: null,
            channelsAsNormal: [],
            channelsAsOp: [],
            channelsAsGod: [],
            channelsAsBanned: [],
            messagesReceived: [],
            messagesSend: [],
            messagesChannel: [],
            twoFactorSecret: null,
            isTwoFactorEnabled: false,
            qrCode: null,
            avatarSvg: avatar,
            requestsSend: [],
            requestsReceived: [],
            blockList: [],
            blockedMeList: [],
            mutedList: [],
            wonMatches: [],
            lostMatches: [],
        }
        return await this.usersRepository.save(user);
    }
    /**
     * Find user by login
     * @param login 
     * @returns UserEntity
     */
    async findByLogin(login: string): Promise<UserEntity> {
        return await this.usersRepository.findOneBy({login});
    }
    /**
     * Find user by id
     * @param id 
     * @returns UserEntity
     */
    async findById(id: string): Promise<UserEntity> {
        const toReturn = await this.usersRepository.findOneBy({id: id});
        return toReturn;
    }
    async findByIdWithAvatar(id: string): Promise<{id: string, login: string, email: string, avatarSvg: AvatarEntity}> {
        return await this.usersRepository
            .createQueryBuilder("user")
            .innerJoinAndSelect("user.avatarSvg", "avatar")
            .where("user.id = :userId", {userId: id})
            .select("user.id", "id")
            .addSelect("login", "login")
            .addSelect("email", "email")
            .addSelect("avatar.avatarSvg", "avatarSvg")
            .getRawOne();
    }
    public findById42(id42: string): Promise<UserEntity> {
        return this.usersRepository.findOneBy({id42});
    }
    
    /**
     * this one is to be able to do some tricks with typeORM.
     * typescript sucks.
     */
    async findByIdAsAny(id: any): Promise<UserEntity> {
        const toReturn = await this.usersRepository.findOneBy({id: id});
        return toReturn;
    }

    public findOne(options?: object): Promise<UserEntity> {
        const user =  this.usersRepository.findOne(options);    
        return (user);  
    }
    /**
     * Display all users
     * @returns 
     */
    async findAll(): Promise<{ id: string, login: string }[]> {
        return await this.usersRepository.createQueryBuilder('user')
          .select(['user.id', 'user.login'])
          .getMany();
    }
    async findAllLogins(): Promise<{ login: string }[]> {
        return await this.usersRepository.createQueryBuilder('user')
          .select(['user.login'])
          .getMany();
    }
    async findAllIds42(): Promise<{ id42: string }[]> {
        return await this.usersRepository.createQueryBuilder('user')
          .select(['user.id42'])
          .getMany();
    }
    /**
     * Update user login
     * @param userToUpdate 
     * @returns 
     */
    async updateLogin(userToUpdate: UpdateLoginDto) {
        return await this.usersRepository.update({id: userToUpdate.id}, {login: userToUpdate.login});
    }
    /**
     * Update user avatar
     * @param userToUpdate 
     * @returns 
     */
    async updateAvatar(userToUpdate: UpdateAvatarDto) {
        const avatarId: {avatarId: string} = await this.usersRepository
            .createQueryBuilder("user")
            .where("user.id = :id", {id: userToUpdate.id})
            .select("user.avatarSvg", "avatarId")
            .getRawOne();
        if (avatarId.avatarId)
            this.avatarService.update(avatarId.avatarId, userToUpdate.avatarSvg);
        else {
            const avatar = await this.avatarService.create(userToUpdate.avatarSvg);
            this.usersRepository.update({id: userToUpdate.id}, {avatarSvg: avatar});
        }
    }
    /**
     * Delete user account
     * @param login 
     */
    async delete(login: string): Promise<void> {
        this.usersRepository.delete(login);
    }
    /**
     * Return the link between an user and a channel
     * @param userId primary key of a user
     * @param channelId primary key of a channel
     * @returns channel: channel entity + status: user status in this channel as a string ("normal", "op" or "god")  
     * exemple {channel: {id: 14ad8e..., channelName: pouet, ...}, status: "op"}
     * returns null if no link exists or user not exist
     */
    async getChannelLink(userId: string, channelId: string): Promise<{channel: ChannelEntity, status: string}> {
        let user = await this.findById(userId);
        if (user == null)
            return null;
        let status: string = null;
        let channel = user.channelsAsGod.find(channel => {
            return channel.id == channelId;
        })
        if (channel != undefined)
            status = "god";
        if (!status) {
            channel = user.channelsAsOp.find(channel => {
                return channel.id == channelId;
            })
            if (channel != undefined)
                status = "op";
        }
        if (!status) {
            channel = user.channelsAsNormal.find(channel => {
                return channel.id == channelId;
            })
            if (channel != undefined)
                status = "normal";
        }
        if (!status)
            return null;
        else
            return {channel, status};
    }

    /**
     * 
     * @param userId user who you want to obtain all the channels he's currently registered
     * @returns a promise of an array of a {channel: ChannelEntity, status: string}, status is either 
     * "god", "op", or "normal" ordered this way in the array:  
     * god < op < normal  
     * and then ordered by channel.name
     */
    async listAllUserChannel(userId: string): Promise<{channel: ChannelEntity, status: string}[]> {
        const user = await this.findById(userId);
        let arrayOfChannels: {channel: ChannelEntity, status: string}[] = [{
            channel: {
                id: "00000000-0000-0000-0000-000000000000",
                date: new Date(),
                name: "general",
                password: false,
                channelPass: null,
                inviteOnly: false,
                normalUsers: [],
                opUsers: [],
                godUser: undefined,
                bannedUsers: [],
                usersMuted: [],
                messages: []
            },
            status: "normal"}];
        let arrayOfGods = new Map<string, {channel: ChannelEntity, status: string}>;
        let arrayOfOps = new Map<string, {channel: ChannelEntity, status: string}>;
        let arrayOfNormals = new Map<string, {channel: ChannelEntity, status: string}>;
        user.channelsAsGod.forEach((channel) => {
            arrayOfGods.set(channel.name, {channel: channel, status: "god"});
        });
        arrayOfGods.forEach((channel) => {
            arrayOfChannels.push(channel);
        });
        user.channelsAsOp.forEach((channel) => {
            arrayOfOps.set(channel.name, {channel: channel, status: "op"});
        });
        arrayOfOps.forEach((channel) => {
            arrayOfChannels.push(channel);
        });
        user.channelsAsNormal.forEach((channel) => {
            arrayOfNormals.set(channel.name, {channel: channel, status: "normal"});
        });
        arrayOfNormals.forEach((channel) => {
            arrayOfChannels.push(channel);
        });
        return arrayOfChannels;
    }
    
    /**
     * set secret code for 2fa in user entity
     * @param secret 
     * @param id 
     * @returns 
     */
    async set2faSecret(secret: string, id: string) {
        const user = await this.usersRepository.findOneBy({id});
        user.twoFactorSecret = secret;
        await this.usersRepository.save(user);
        return (user.twoFactorSecret);
    }
    /**
     * set secret code for 2fa in user entity
     * @param qrcode 
     * @param id 
     * @returns 
     */
    async setQrCode(qrcode: string, id: string) {
        const user = await this.usersRepository.findOneBy({id});
        user.qrCode = qrcode;
        await this.usersRepository.save(user);
        return (user.qrCode);
    }
    /**
     * the user turned on the 2fa
     * @param user 
     * @returns 
     */
    async turnOn2fa(user: UserEntity) {
        user.isTwoFactorEnabled = true;
        await this.usersRepository.save(user);
        return (user.isTwoFactorEnabled);
    }
    /**
     * the user turned off the 2fa
     * @param id 
     * @returns 
     */
    async turnOff2fa(id: string) {
        const user = await this.usersRepository.findOneBy({id});
        user.isTwoFactorEnabled = false;
        await this.usersRepository.save(user);
        return (user.isTwoFactorEnabled);
    }
    /**
     * upload avatar
     * @param id 
     * @param file 
     */
    async loadAvatar(id: string, file: string) {
        const avatarId: {avatarId: string} = await this.usersRepository
            .createQueryBuilder("user")
            .where("user.id = :id", {id: id})
            .select("user.avatarSvg", "avatarId")
            .getRawOne();
        if (avatarId.avatarId)
            this.avatarService.update(avatarId.avatarId, file);
        else {
            const avatar = await this.avatarService.create(file);
            this.usersRepository.update({id: id}, {avatarSvg: avatar});
        }
    }

    async getAvatar(id : string): Promise<string> {
        const userAvatar: AvatarEntity = await this.usersRepository.createQueryBuilder("user")
            .innerJoinAndSelect("user.avatarSvg", "avatar")
            .where("user.id = :id", { id: id })
            .select("avatar.*", "avatarSvg")
            .getRawOne();
        return userAvatar.avatarSvg;
    }

    async getFriendRequestsSend(id: string): Promise<IRequest[]> {
        const requestsSend: IRequest[] = await this.usersRepository.createQueryBuilder("user")
            .where("user.id = :id", { id: id })
            .innerJoinAndSelect("user.requestsSend", "send")
            .select("send.*")
            .getRawMany();
        return requestsSend;
    }

    async getFriendRequestsReceived(id: string): Promise<IRequest[]> {
        const requestsReceived: IRequest[] = await this.usersRepository.createQueryBuilder("user")
            .where("user.id = :id", { id: id })
            .innerJoinAndSelect("user.requestsReceived", "receiv")
            .select("receiv.*")
            .getRawMany();
        return requestsReceived;
    }

    async addUserToBlock(userId: string, userIdToBlock: string) {
        await this.usersRepository
            .createQueryBuilder()
            .relation(UserEntity, "blockList")
            .of(userId)
            .add(userIdToBlock);
    }

    async delUserToBlock(userId: string, userIdToUnblock: string) {
        await this.usersRepository
            .createQueryBuilder()
            .relation(UserEntity, "blockList")
            .of(userId)
            .remove(userIdToUnblock);
    }

    async getBlockList(userId: string): Promise<{id: string, name: string}[]> {
        return await this.usersRepository
            .createQueryBuilder("user")
            .innerJoinAndSelect("user.blockList", "blocked")
            .select("blocked.id", "id")
            .addSelect("blocked.login", "name")
            .where("user.id = :id", { id : userId })
            .getRawMany();
    }

    async getBlockedMeList(userId: string): Promise<{id: string, name: string}[]> {
        return await this.usersRepository
            .createQueryBuilder("user")
            .innerJoinAndSelect("user.blockedMeList", "blockedMe")
            .select("blockedMe.id", "id")
            .addSelect("blockedMe.login", "name")
            .where("user.id = :id", { id : userId })
            .getRawMany();
    }

    async getAllBlockRelations(userId: string): Promise<{id: string, name: string}[]> {
        return [...await this.getBlockList(userId), ...await this.getBlockedMeList(userId)];
    }

    async getMuteList(userId: string): Promise<{id: string}[]> {
        return await this.usersRepository
            .createQueryBuilder("user")
            .innerJoinAndSelect("user.mutedList", "mute")
            .select("mute.id", "id")
            .where("user.id = :id", { id : userId })
            .getRawMany();
    }
}