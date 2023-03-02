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
    // find all messages send to a receiver oreder by date
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
}