import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from "@nestjs/websockets";
import { Server, Socket, Namespace } from 'socket.io';
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
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('ChatGateway');
    private chatNamespace: Namespace;

    constructor(
        private messageService: MessageService,
    ) 
    {}

    private socketMap: Map<string, string> = new Map<string, string>;

    @UseGuards(AuthGuard('websocket'))
    handleConnection(client: Socket) {
		if (client.handshake.auth['token'] != null) {
			let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
			this.socketMap.set(pseudo, client.id);
            this.logger.log(`${pseudo} is connected`);
			console.log(this.socketMap);
		}
    }

    afterInit(server: Server) {
        this.chatNamespace = server.of('chat');
        this.logger.log('Init');
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
        let token = client.handshake.query.token;
		if (client.handshake.auth['token'] != null) {
			pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
		}
        let sender: string = client.id;
        this.socketMap.set(pseudo, sender);
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
        if (!blop.isChannel)
        {
            client.emit('selfMessage', toSend);
            let socketDest = this.socketMap.get(blop.room);
            this.logger.log(socketDest);
            if (socketDest != undefined)
            {
                console.log("message", blop.room, pseudo, blop.content);
                this.chatNamespace.sockets.get(blop.room).emit("messagePrivate", toSend);
                this.logger.log("msg send");
            }
            //this.messageService.findByPrivate(blop.room, pseudo).then((data) => console.log(data));
        }
        else
        {
            
            this.messageService.findByChannel(blop.room).then((data) => console.log(data));
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
