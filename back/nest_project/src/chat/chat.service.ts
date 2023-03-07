import { Injectable } from "@nestjs/common";
import { Namespace, Server, Socket } from "socket.io";
import { IHandle, IMessageChat, IMessageToSend, IToken } from "./chat.interface";
import * as jsrsasign from 'jsrsasign';
import { MessageEntity } from "./message/message.entity";
import { MessageService } from "./message/message.service";
import { ChannelService } from "./channel/channel.service";

@Injectable({})
export class ChatService {
    constructor (
        private messageService: MessageService,
        private channelService: ChannelService
    ) {}

    private extractLogin(client: Socket): string {
        let object: IToken = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj;
        if (object == undefined) {
            client.emit("fromServerMessage", "you're token is invalid");
            return null;
        }
        let pseudo: string = object.login;
        return pseudo;
    }

    private messageEntityfier(login: string, data: IMessageChat): MessageEntity {
        return {
            id: undefined,
            room: data.room,
            isChannel: data.isChannel,
            sender: login,
            content: data.content,
            date: undefined
        };
    }

    private channelEntityfier() {

    }

    private toSendFormat(login: string, data: IMessageChat): IMessageToSend {
        return {
            sender: login,
            room: data.room,
            content: data.content
        };
    }

    public connectEvent(data: IHandle) {
        if (data.client.handshake.auth['token'] != null) {
            let login = this.extractLogin(data.client);
            if (!login)
            {
                data.logger.log(`undefined token`);
                return;
            }
            data.chatNamespace.sockets.set(data.client.id, data.client);
            data.socketMap.set(login, data.client);
            data.client.join("general");
            data.client.emit("getRoom", "general", []);
            data.logger.log(`${login} is connected, ${data.client.id}`);
            data.client.emit("test", "blop");
        }
    }

    public disconnectEvent(data: IHandle) {
        if (data.client.handshake.auth['token'] != null) {
            let login = this.extractLogin(data.client);
            data.chatNamespace.sockets.delete(data.client.id);
            if (!login)
                return;
            let room: string = data.client.rooms.values().next().value;
            data.socketMap.delete(login);
            data.chatNamespace.to(room).emit("fromServerMessage", login, ' just disconnect');
            data.logger.log(`${login} is disconnected`);
        }
    }

    public newMessageEvent(data: IHandle) {
        let login = this.extractLogin(data.client);
        if (!login)
            return;
        const toSend: IMessageToSend = this.toSendFormat(login, data.message);
        this.messageService.create(this.messageEntityfier(login, data.message));
        data.client.emit('selfMessage', toSend);
        if (!data.message.isChannel)
        {
            let socketDest = data.socketMap.get(data.message.room);
            if (socketDest != undefined)
                socketDest.emit("messagePrivate", toSend);
        }
        else {
            data.chatNamespace.to(data.message.room).emit("messageChannel", toSend);
        }
    }

    public historyEvent(data: IHandle) {
        if (data.message.isChannel)
            this.messageService.findByChannel(data.message.room).then((pouet) => data.client.emit("history", pouet));
        else {
            let login = this.extractLogin(data.client);
            if (!login)
                return;
            this.messageService.findByPrivate(data.message.room, login).then((pouet) => data.client.emit("history", pouet));
        }
    }

    public joinChannelEvent(data: IHandle) {
        this.channelService.getOneByName(data.channelEntries.channelName)
        .then(
            (result) => {
                if (result) {

                }
                else
                    data.client.emit('')
            }
        )
        .catch(

        )
    }

    public createChannelEvent(data: IHandle) {

    }
}