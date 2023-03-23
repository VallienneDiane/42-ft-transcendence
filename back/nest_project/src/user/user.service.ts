import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MessagePrivateEntity } from "src/chat/messagePrivate/messagePrivate.entity";
import { Repository } from "typeorm";
import { ChannelEntity } from "../chat/channel/channel.entity";
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
    // SIGN IN OR DISPLAY ONE USER PROFILE BY ID
    public findById(id: string): Promise<UserDto> {
        return this.usersRepository.findOneBy({id: id});
    }
    
    public findOne(options?: object): Promise<UserDto> {
        const user =  this.usersRepository.findOne(options);    
        return (user);  
    }
    // DISPLAY ALL USERS
    public findAll(): Promise<UserEntity[]> {
        return this.usersRepository.find();
    }
    // UPDATE USER INFOS
    async update(login: string, User: UserEntity): Promise<void> {
        this.usersRepository.update(login, User);
    }
    // DELETE USER ACCOUNT BY ID
    async delete(login: string): Promise<void> {
        this.usersRepository.delete(login);
    }
    // REGISTER CLIENT TO A CHANNEL AS NORMAL USER IN DATABASE
    async addChannelAsNormalUser(userId: string, channel: ChannelEntity) {
        let channels = (await this.usersRepository.findOne({where: {id: userId}})).channelsAsNormal;
        channels.push(channel);
        await this.usersRepository.update({id: userId}, {channelsAsNormal: channels});
    }
    // REGISTER CLIENT TO A CHANNEL AS OP USER IN DATABASE
    async addChannelAsOpUser(userId: string, channel: ChannelEntity) {
        let channels = (await this.usersRepository.findOne({where: {id: userId}})).channelsAsOp;
        channels.push(channel);
        await this.usersRepository.update({id: userId}, {channelsAsOp: channels});
    }
    // UNREGISTER CLIENT TO A CHANNEL AS NORMAL USER IN DATABASE
    async deleteChannelAsNormalUser(userId: string, channelId: string) {
        let channels = (await this.usersRepository.findOne({where: {id: userId}})).channelsAsNormal;
        channels = channels.filter((channel) => {
            return channel.id !== channelId;
        })
        await this.usersRepository.update({id: userId}, {channelsAsNormal: channels});
    }
    // UNREGISTER CLIENT TO A CHANNEL AS OP USER IN DATABASE
    async deleteChannelAsOpUser(userId: string, channelId: string) {
        let channels = (await this.usersRepository.findOne({where: {id: userId}})).channelsAsOp;
        channels = channels.filter((channel) => {
            return channel.id !== channelId;
        })
        await this.usersRepository.update({id: userId}, {channelsAsOp: channels});
    }
    // SEND A PRIVATE MESSAGE TO ANOTHER PERSON
    async sendPrivateMessage(meId: string, himId: string, content: string) {
        let me = await this.findById(meId);
        if (me == null)
            return;
        let him = await this.findById(himId);
        if (him == null)
            return;
        let message: MessagePrivateEntity = {
            id: undefined,
            sender: me,
            receiver: him,
            content: content,
            date: undefined
        };
        let messages = me.messagesSend;
        messages.push(message);
        await this.usersRepository.update({id: meId}, {messagesSend: messages});
    }
    // GET ALL PRIVATE MESSAGES ORDERED BY DATE
    async getPrivateMessages(meId: string, himId: string): Promise<MessagePrivateEntity[]> {
        let me = await this.findById(meId);
        let messages: MessagePrivateEntity[] = await this.usersRepository
            .createQueryBuilder("MessagePrivateEntity")
            .leftJoinAndSelect()
    }
}