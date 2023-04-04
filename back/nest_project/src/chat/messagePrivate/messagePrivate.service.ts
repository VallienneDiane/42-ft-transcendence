import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "src/user/user.entity";
import { Brackets, NotBrackets, Repository } from "typeorm";
import { MessagePrivateEntity } from "./messagePrivate.entity";
import { IUserToEmit } from "../chat.interface"

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
    /**
     * 
     * @param personAId 
     * @param personBId 
     * @returns a dialogue between 2 users ordered by date
     */
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

    async listDM(user: UserEntity): Promise<IUserToEmit[]> {
        const received: IUserToEmit[] = await this.messagesRepository
            .createQueryBuilder("message")
            .innerJoinAndSelect("message.receiver", "user")
            .leftJoinAndSelect("message.sender", "other")
            .where("user.id = :id", { id: user.id })
            .select("other.id", "id")
            .addSelect("other.login", "login")
            .distinct(true)
            .getRawMany();
        const send: IUserToEmit[] = await this.messagesRepository
            .createQueryBuilder("message")
            .innerJoinAndSelect("message.sender", "user")
            .leftJoinAndSelect("message.receiver", "other")
            .where("user.id = :id", { id: user.id })
            .select("other.id", "id")
            .addSelect("other.login", "login")
            .distinct(true)
            .getRawMany();
        let argie = new Map<string, string>();
        for (let elt of received) {
            argie.set(elt.id, elt.login);
        }
        for (let elt of send) {
            argie.set(elt.id, elt.login);
        }
        let allDM: IUserToEmit[] = [];
        argie.forEach((login, id) => {
            allDM.push({id: id, login: login});
        });
        allDM.sort((a, b) => {
            return a.login.localeCompare(b.login);
        })
        return allDM;
    }
}