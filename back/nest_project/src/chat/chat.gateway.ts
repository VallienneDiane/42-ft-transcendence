import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from "@nestjs/websockets";
import { Server as SocketIOServer, Socket, Namespace } from '@nestjs/platform-socket.io/node_modules/socket.io';
import { Logger, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { MessageService } from "./message/message.service";
import { MessageEntity } from "./message/message.entity";
import * as jsrsasign from 'jsrsasign';


interface MessageChat {
    room: string;
    isChannel: boolean;
    content?: string;
}

interface MessageToSend {
    sender?: string;
    room: string;
    content: string;
}

@WebSocketGateway({transports: ['websocket'], namespace: '/chat'})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: SocketIOServer;
    private logger: Logger = new Logger('ChatGateway');

    constructor(
        private messageService: MessageService,
    ) 
    {}

    private socketMap: Map<string, Socket> = new Map<string, Socket>;

    handleConnection(client: Socket) {
		if (client.handshake.auth['token'] != null) {
            const playload = client.handshake.auth['token']
			let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
			this.socketMap.set(pseudo, client);
            this.logger.log(`${pseudo} is connected`);
		}
    }

    handleDisconnect(client: Socket) {
		if (client.handshake.auth['token'] != null) {
			let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
			this.socketMap.delete(pseudo);
			this.logger.log(`${pseudo} is disconnected`);
		}
    }

    @SubscribeMessage('addMessage')
    handleNewMessage(@MessageBody() blop: MessageChat, @ConnectedSocket() client: Socket) {
        let pseudo = "unknow";
		if (client.handshake.auth['token'] != null) {
			pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
		}
        this.socketMap.set(pseudo, client);
        console.log('ChatGateway::handleNewMessage : ', blop, pseudo);
        let data: MessageEntity = {
            id: undefined,
            room: blop.room,
            isChannel: blop.isChannel,
            sender: pseudo,
            content: blop.content,
            date: undefined
        }
        this.messageService.create(data);
        let toSend : MessageToSend = {sender: pseudo, room: blop.room, content: blop.content};
        client.emit('selfMessage', toSend);
        if (!blop.isChannel)
        {
            let socketDest = this.socketMap.get(blop.room);
            if (socketDest != undefined)
            {
                console.log("message", blop.room, pseudo, blop.content);
                socketDest.emit("messagePrivate", toSend);
                this.logger.log("msg send");
            }
        }
        else
        {
            

        }
    }

    @SubscribeMessage('history')
    handleHistory(@MessageBody() data: MessageChat, @ConnectedSocket() client: Socket) {
        if (data.isChannel)
        {
            this.messageService.findByChannel(data.room).then((data) => client.emit("history", data));
        }
        else
        {
            let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
            this.messageService.findByPrivate(data.room, pseudo).then((data) => client.emit("history", data));
        }
    }

    @SubscribeMessage('history')
    handleHistory(@MessageBody() data: MessageChat, @ConnectedSocket() client: Socket) {
        if (data.isChannel)
        {
            this.messageService.findByChannel(data.room).then((data) => client.emit("history", data));
        }
        else
        {
            let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
            this.messageService.findByPrivate(data.room, pseudo).then((data) => client.emit("history", data));
        }
    }
    // // @UseGuards(AuthGuard('jwt'))
    // @SubscribeMessage('privateMessage')
    // async handlePrivateEvent(@MessageBody() data: MessageChat, @ConnectedSocket() client: Socket): Promise<void> {
    //     let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj;
    //     console.log(pseudo, client.id, data.room, data.content);
    //     client.emit('message', { sender: client.id, room: data.room, content: data.content });          
    // }
}
