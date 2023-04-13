import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Channel } from "diagnostics_channel";
import { MessagePrivateEntity } from "src/chat/messagePrivate/messagePrivate.entity";
import { ChannelEntity } from "../chat/channel/channel.entity";
import { ByteData } from "qrcode";
import { Repository } from "typeorm";
import { UserDto } from "./user.dto";
import { UserEntity } from "./user.entity";
import { FriendEntity } from "../chat/relation/friend/friend.entity";

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
    async findByLogin(login: string): Promise<UserEntity> {
        return await this.usersRepository.findOneBy({login});
    }
    // SIGN IN OR DISPLAY ONE USER PROFILE BY ID
    async findById(id: string): Promise<UserEntity> {
        const toReturn = await this.usersRepository.findOneBy({id: id});
        return toReturn
    }
    
    public findOne(options?: object): Promise<UserEntity> {
        const user =  this.usersRepository.findOne(options);    
        return (user);  
    }
    public findById42(id42: number): Promise<UserEntity> {
        return this.usersRepository.findOneBy({id42});
    }
    // DISPLAY ALL USERS
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
    async findAllIds42(): Promise<{ id42: number }[]> {
        return await this.usersRepository.createQueryBuilder('user')
          .select(['user.id42'])
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
    /**
     * return the link between an user and a channel
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
    
    //set secret code for 2fa in user entity
    async set2faSecret(secret: string, id: string) {
        const user = await this.usersRepository.findOneBy({id});
        user.twoFactorSecret = secret;
        await this.usersRepository.save(user);
        return (user.twoFactorSecret);
    }
    //set secret code for 2fa in user entity
    async setQrCode(qrcode: string, id: string) {
        const user = await this.usersRepository.findOneBy({id});
        user.qrCode = qrcode;
        await this.usersRepository.save(user);
        return (user.qrCode);
    }
    //the user turned on the 2fa
    async turnOn2fa(user: UserEntity) {
        user.isTwoFactorEnabled = true;
        await this.usersRepository.save(user); //save value of param isTwoFactorEnabled in db
        return (user.isTwoFactorEnabled);
    }
    //the user turned off the 2fa
    async turnOff2fa(id: string) {
        const user = await this.usersRepository.findOneBy({id});
        user.isTwoFactorEnabled = false;
        await this.usersRepository.save(user);
        return (user.isTwoFactorEnabled);
    }

    //upload avatar
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
            .select("send.id", "id")
            .addSelect("send.receiver", "receiver")
            .addSelect("send.sender", "sender")
            .addSelect("send.state", "state")
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

    async getMuteList(userId: string): Promise<{id: string}[]> {
        return await this.usersRepository
            .createQueryBuilder("user")
            .innerJoinAndSelect("user.mutedList", "mute")
            .select("mute.id", "id")
            .where("user.id = :id", { id : userId })
            .getRawMany();
    }
}