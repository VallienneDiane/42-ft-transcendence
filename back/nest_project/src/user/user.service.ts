import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Channel } from "diagnostics_channel";
import { MessagePrivateEntity } from "src/chat/messagePrivate/messagePrivate.entity";
import { ChannelEntity } from "../chat/channel/channel.entity";
import { ByteData } from "qrcode";
import { Repository } from "typeorm";
import { SignUp42Dto, SignUpDto, UpdateAvatarDto, UpdateLoginDto } from "./user.dto";
import { UserEntity } from "./user.entity";
import { FriendEntity } from "../chat/relation/friend/friend.entity";

@Injectable({})
export class UserService {
    constructor (
        @InjectRepository(UserEntity)
        private readonly usersRepository: Repository<UserEntity>
    ) {}
    /**
     * Create new user and save it in database
     * @param newUser 
     * @returns UserEntity
     */
    async create(newUser: SignUpDto): Promise<UserEntity> {
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
            avatarSvg: null,
            requestsSend: [],
            requestsReceived: [],
            blockList: [],
            blockedMeList: [],
        }
        return await this.usersRepository.save(user);
    }
    async create42(newUser: SignUp42Dto): Promise<UserEntity> {
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
            avatarSvg: newUser.avatarSvg,
            requestsSend: [],
            requestsReceived: [],
            blockList: [],
            blockedMeList: [],
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
    public findById42(id42: string): Promise<UserEntity> {
        return this.usersRepository.findOneBy({id42});
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
        return await this.usersRepository.update({id: userToUpdate.id}, {avatarSvg: userToUpdate.avatarSvg});
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

    // async listDM(userId: string): Promise< Map<string, {user: UserEntity, connected: boolean}> > {
    //     let sorted = new Map<string, {user: UserEntity, connected: boolean}>();
    //     const msgSendDM: UserEntity[] = await this.usersRepository
    //         .createQueryBuilder("user")
    //         .leftJoinAndSelect("user.messagesSend", "send")
    //         .select("send.receiver")
    //         .where("user.id = :id", { id: userId })
    //         .getRawMany();
    //     const msgReceivedDM: UserEntity[] = await this.usersRepository
    //         .createQueryBuilder("user")
    //         .leftJoinAndSelect("user.messagesReceived", "received")
    //         .select("received.sender")
    //         .where("user.id = :id", { id: userId })
    //         .getRawMany();
    //     msgSendDM.forEach((user) => {
    //         sorted.set(user.login, {user: user, connected: false});
    //     })
    //     msgReceivedDM.forEach((user) => {
    //         sorted.set(user.login, {user: user, connected: false});
    //     })
    //     return sorted;
    // }
    
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
        const user = await this.usersRepository.findOneBy({id});
        user.avatarSvg = file;
        await this.usersRepository.save(user);
    }

    async getAvatar(id : string): Promise<string> {
        const userAvatar: string = await this.usersRepository.createQueryBuilder()
            .where("user.id = :id", { id: id })
            .select("user.avatarSvg")
            .from(UserEntity, 'user')
            .getRawOne();
        return userAvatar;
    }

    async getFriendRequestsSend(id: string): Promise<FriendEntity[]> {
        const requestsSend: FriendEntity[] = await this.usersRepository.createQueryBuilder("user")
            .where("user.id = :id", { id: id })
            .innerJoinAndSelect("user.requestsSend", "send")
            .select("send.*")
            .getRawMany();
        return requestsSend;
    }

    async getFriendRequestsReceived(id: string): Promise<FriendEntity[]> {
        const requestsReceived: FriendEntity[] = await this.usersRepository.createQueryBuilder("user")
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
}