import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { MessageService } from "./message.service";
import { MessageEntity } from "./message.entity";


import * as jsrsasign from 'jsrsasign';

interface MessageChat {
    room: string;
    isChannel: boolean;
    content: string;
}

@WebSocketGateway({transports: ['websocket']})
export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    constructor(
        private messageService: MessageService,
    ) 
    {}

    private socketMap: Map<string, string> = new Map<string, string>;

    handleConnection(client: Socket) {
        let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
        this.socketMap.set(pseudo, client.id);
        console.log(pseudo + ' is connected.');
        console.log(this.socketMap);
    }

    handleDisconnect(client: Socket) {
        let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
        this.socketMap.delete(pseudo);
        console.log(pseudo + ' is disconnected.');
    }

    @SubscribeMessage('addMessage')
    handleNewMessage(@MessageBody() blop: MessageChat, @ConnectedSocket() client: Socket) {
        let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
        let sender: string = client.id;
        this.socketMap.set(pseudo, sender);
        console.log('MessageGateway::handleNewMessage : ', blop, pseudo);
        let data: MessageEntity = {
            id: undefined,
            room: blop.room,
            isChannel: blop.isChannel,
            sender: pseudo,
            content: blop.content,
            date: undefined
        }
        this.messageService.create(data);
        if (!blop.isChannel)
        {
            client.emit('newMessage', blop.room, pseudo, blop.content);
            let socketDest = this.socketMap.get(blop.room);
            if (socketDest != undefined)
                this.server.of("/").sockets.get(socketDest).emit("newMessage", blop.room, pseudo, blop.content);
        }
        else
        {
            
        }
        this.messageService.findByReceiver(blop.room).then((data) => console.log(data));
    }
    // // @UseGuards(AuthGuard('jwt'))
    // @SubscribeMessage('privateMessage')
    // async handlePrivateEvent(@MessageBody() data: MessageChat, @ConnectedSocket() client: Socket): Promise<void> {
    //     let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj;
    //     console.log(pseudo, client.id, data.room, data.content);
    //     client.emit('message', { sender: client.id, room: data.room, content: data.content });          
    // }
}
