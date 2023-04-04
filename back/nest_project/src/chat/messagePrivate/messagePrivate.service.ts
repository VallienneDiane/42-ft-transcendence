import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "src/user/user.entity";
import { Brackets, Repository } from "typeorm";
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
    async findConversation(personAId: string, personBId: string): Promise<{date: Date, sender: string, content: string}[]> {
        const obj: {date: Date, sender: string, content: string}[] =
        await this.messagesRepository.createQueryBuilder("MessagePrivateEntity")
        .leftJoinAndSelect("MessagePrivateEntity.sender", "sender")
        .leftJoinAndSelect("MessagePrivateEntity.receiver", "receiver")
        .where(
            new Brackets((qb) => {
                qb.where("sender.id = :senderIdA", {senderIdA: personAId})
                .andWhere("receiver.id = :receiverIdB", {receiverIdB: personBId})
            })
        )
        .orWhere(
            new Brackets((qb) => {
                qb.where("sender.id = :senderIdB", {senderIdB: personBId})
                .andWhere("receiver.id = :receiverIdA", {receiverIdA: personAId})
            })
        )
        .select("date", "date")
        .addSelect("sender.login", "sender")
        .addSelect("content")
        .orderBy({"MessagePrivateEntity.date": "ASC"})
        .getRawMany();
        return obj;
    }

    async sendPrivateMessage(sender: UserEntity, receiver: UserEntity, message: string) {
        let newMessage: MessagePrivateEntity = {
            id: undefined,
            sender: sender,
            receiver: receiver,
            content: message,
            date: undefined
        };
        await this.messagesRepository.save(newMessage);
    }
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