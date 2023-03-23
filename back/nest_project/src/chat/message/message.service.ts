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
        if (!(newMessage.isChannel && newMessage.room == 'general'))
            return this.messagesRepository.save(newMessage);
        return undefined;
    }
    // find all messages send to a receiver ordered by date
    public findByChannel(roomEntry: string): Promise<MessageEntity[]> {
        return this.messagesRepository.find({
            where: {
                room: roomEntry,
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
                { room: personA, sender: personB, isChannel: false },
                { room: personB, sender: personA, isChannel: false },
            ],
            order: {
                date: "ASC",
            }
        })
    }
    
    public findAllDialogByUserName(userName: string): Promise<MessageEntity[]> {
        return this.messagesRepository.find({
            where: [
                { room: userName, isChannel: false },
                { sender: userName, isChannel: false },
            ]
        })
    }
    //update all row containing an username when this username is about to change
    async changeUserName(oldUserName: string, newUserName: string): Promise<void> {
        this.messagesRepository.update({sender: oldUserName}, {sender: newUserName});
        this.messagesRepository.update({room: oldUserName, isChannel: false}, {room: newUserName});
    }
    //update all row containing an channel name when this channel name is about to change
    async changeChannelName(oldChannelName: string, newChannelName: string): Promise<void> {
        this.messagesRepository.update({room: oldChannelName, isChannel: true}, {room: newChannelName});
    }
    //delete all rows containing a given channel name
    async deleteChannel(channelName: string): Promise<void> {
        this.messagesRepository.delete({room: channelName, isChannel: true});
    }
    //delete all rows containing a given username
    async deleteUser(userName: string): Promise<void> {
        this.messagesRepository.delete({room: userName, isChannel: false});
        this.messagesRepository.delete({sender: userName});
    }

}