import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MessageEntity } from "./message.entity";

@Injectable({})
export class MessageService {
    constructor (
        @InjectRepository(MessageEntity)
        private readonly messagesRepository: Repository<MessageEntity>
    ) {}
    // save a new message in database
    public create(newMessage: MessageEntity): Promise<MessageEntity> {
        return this.messagesRepository.save(newMessage);
    }
    // find all messages send to a receiver ordered by date
    public findByChannelId(channelId: string): Promise<MessageEntity[]> {
        return this.messagesRepository.find({
            where: {
                roomId: channelId,
                isChannel: true,
            },
            order: {
                date: "ASC",
            }
        })
    }
    // find a dialogue between 2 users ordered by date
    public findByPrivate(personA: string, personB: string): Promise<MessageEntity[]> {
        return this.messagesRepository.find({
            where: [
                { roomId: personA, senderId: personB, isChannel: false },
                { roomId: personB, senderId: personA, isChannel: false },
            ],
            order: {
                date: "ASC",
            }
        })
    }
    
    public findAllDialogByUserName(userId: string): Promise<MessageEntity[]> {
        return this.messagesRepository.find({
            where: [
                { roomId: userId, isChannel: false },
                { senderId: userId, isChannel: false },
            ]
        })
    }
    //delete all rows containing a given channel name
    async deleteChannel(channelId: string): Promise<void> {
        this.messagesRepository.delete({roomId: channelId, isChannel: true});
    }
    //delete all rows containing a given username
    async deleteUser(userId: string): Promise<void> {
        this.messagesRepository.delete({roomId: userId, isChannel: false});
        this.messagesRepository.delete({senderId: userId});
    }

}