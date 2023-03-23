import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MessagePrivateEntity } from "./messagePrivate.entity";

@Injectable({})
export class MessagePrivateService {
    constructor (
        @InjectRepository(MessagePrivateEntity)
        private readonly messagesRepository: Repository<MessagePrivateEntity>
    ) {}
    // save a new message in database
    public create(newMessage: MessagePrivateEntity): Promise<MessagePrivateEntity> {
        return this.messagesRepository.save(newMessage);
    }
    // find a dialogue between 2 users ordered by date
    // public findByPrivate(personAId: string, personBId: string): Promise<MessagePrivateEntity[]> {
    //     return this.messagesRepository.find({
    //         where: [
    //             { receiverId: personAId, senderId: personBId },
    //             { receiverId: personBId, senderId: personAId },
    //         ],
    //         order: {
    //             date: "ASC",
    //         }
    //     })
    // }
    // //give all message including the userId, not ordered
    // public findAllDialogByUserName(userId: string): Promise<MessagePrivateEntity[]> {
    //     return this.messagesRepository.find({
    //         where: [
    //             { receiverId: userId },
    //             { senderId: userId },
    //         ]
    //     })
    // }
    // //delete all rows containing a given username
    // async deleteUser(userId: string): Promise<void> {
    //     this.messagesRepository.delete({receiverId: userId});
    //     this.messagesRepository.delete({senderId: userId});
    // }

}