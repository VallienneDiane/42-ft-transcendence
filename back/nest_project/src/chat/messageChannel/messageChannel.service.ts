import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "src/user/user.entity";
import { Repository } from "typeorm";
import { ChannelDto } from "../channel/channel.dto";
import { ChannelEntity } from "../channel/channel.entity";
import { MessageChannelDto } from "./messageChannel.dto";
import { MessageChannelEntity } from "./messageChannel.entity";

@Injectable({})
export class MessageChannelService {
    constructor (
        @InjectRepository(MessageChannelEntity)
        private readonly messagesRepository: Repository<MessageChannelEntity>
    ) {}
    // save a new message in database
    public create(newMessage: MessageChannelDto): Promise<MessageChannelEntity> {
        return this.messagesRepository.save(newMessage);
    }
    //delete all rows containing a given channelId
    async deleteChannel(channel: ChannelDto): Promise<void> {
        this.messagesRepository.delete({channel: channel});
    }
    //delete all rows containing a given userId
    async deleteUser(user: UserEntity): Promise<void> {
        this.messagesRepository.delete({user: user});
    }

    async addMessage(user: UserEntity, channel: ChannelEntity, message: string) {
        let newMessage: MessageChannelEntity = {
            id: undefined,
            content: message,
            date: undefined,
            user: user,
            channel: channel
        }
        await this.messagesRepository.save(newMessage);
    }

}