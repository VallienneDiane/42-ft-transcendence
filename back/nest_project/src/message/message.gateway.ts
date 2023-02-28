import { Injectable } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { DataSource } from "typeorm";
import { MessageDto } from "./message.dto";
import { MessageService } from "./message.service";
import * as jsrsasign from 'jsrsasign'
import { MessageEntity } from "./message.entity";

@WebSocketGateway({transports: ['websockets']})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private messageService: MessageService,
        private socketMap: Map<string, string>
    )
    {}
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
        this.socketMap.set(pseudo, client.id);
        console.log(pseudo + ' is connected.');
    }

    handleDisconnect(client: Socket) {
        let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
        this.socketMap.delete(pseudo);
        console.log(pseudo + ' is disconnected.');
    }

    @SubscribeMessage('addMessage')
    handleNewMessage(@MessageBody() room: string, isChannel: boolean, content: string, @ConnectedSocket() client: Socket) {
        let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
        let sender: string = client.id;
        this.socketMap.set(pseudo, sender);
        console.log('MessageGateway::handleNewMessage : ', room, pseudo, content);
        let data: MessageEntity = {
            id: undefined,
            room: room,
            isChannel: isChannel,
            sender: pseudo,
            content: content,
            date: undefined
        }
        this.messageService.create(data);
        if (!isChannel)
        {
            client.emit('newMessage', room, pseudo, content);
            let socketDest = this.socketMap.get(room);
            if (socketDest != undefined)
                this.server.of("/").sockets.get(socketDest).emit("newMessage", room, pseudo, content);
        }
        else
        {
            
        }
    }
}