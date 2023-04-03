import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Channel } from "diagnostics_channel";
import { MessagePrivateEntity } from "src/chat/messagePrivate/messagePrivate.entity";
import { DataSource, Repository } from "typeorm";
import { ChannelEntity } from "../chat/channel/channel.entity";
import { UserDto } from "./user.dto";
import { UserEntity } from "./user.entity";

interface User {
    id: number,
    login: string,
    email: string,
    twoFactorSecret: string,
    isTwoFactorEnabled: boolean,
    qrCode: string,
    avatarSvg: string
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
    public findByLogin(login: string): Promise<UserEntity> {
        return this.usersRepository.findOneBy({login});
    }
    // SIGN IN OR DISPLAY ONE USER PROFILE BY ID
    async findById(id: string): Promise<UserEntity> {
        // console.log(`${id}`)
        const toReturn = await this.usersRepository.findOneBy({id: id});
        // console.log(`${id} apres ooooooooooooooooooooooooooooooooooooooooooo findById`)
        return toReturn
    }
    
    public findOne(options?: object): Promise<UserEntity> {
        const user =  this.usersRepository.findOne(options);    
        return (user);  
    }
    // DISPLAY ALL USERS
    async findAll(): Promise<{ id: string, login: string }[]> {
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
                id: "general",
                date: new Date(),
                name: "general",
                password: false,
                channelPass: null,
                opNumber: 0,
                inviteOnly: false,
                persistant: true,
                onlyOpCanTalk: false,
                hidden: false,
                normalUsers: [],
                opUsers: [],
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
     * SEND A PRIVATE MESSAGE TO ANOTHER PERSON
     * @param meId primary key of user 1
     * @param himId primary key of user 2
     * @param content random text
     * @returns nothing
     */
    async sendPrivateMessage(meId: string, himId: string, content: string) {
        let me = await this.findById(meId);
        if (me == null)
            return;
        let him = await this.findById(himId);
        if (him == null)
            return;
        let message = {
            sender: me,
            receiver: him,
            content: content,
        };
        // let messages = me.messagesSend;
        // messages.push(message);
        // await this.usersRepository.save(me);
        await this.usersRepository
            .createQueryBuilder()
            .relation(UserEntity, "messagesSend")
            .of(me)
            .add(message);
    }

    async listDM(userId: string): Promise< Map<string, {user: UserEntity, connected: boolean}> > {
        let sorted = new Map<string, {user: UserEntity, connected: boolean}>();
        const msgSendDM: UserEntity[] = await this.usersRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.messagesSend", "send")
            .select("send.receiver")
            .where("user.id = :id", { id: userId })
            .getRawMany();
        const msgReceivedDM: UserEntity[] = await this.usersRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.messagesReceived", "received")
            .select("received.sender")
            .where("user.id = :id", { id: userId })
            .getRawMany();
        msgSendDM.forEach((user) => {
            sorted.set(user.login, {user: user, connected: false});
        })
        msgReceivedDM.forEach((user) => {
            sorted.set(user.login, {user: user, connected: false});
        })
        return sorted;
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
}