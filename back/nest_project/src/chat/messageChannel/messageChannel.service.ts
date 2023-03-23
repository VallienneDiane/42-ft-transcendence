import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChannelDto } from "../channel/channel.dto";
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
    async deleteUser(userId: string): Promise<void> {
        this.messagesRepository.delete({userId: userId});
    }

}