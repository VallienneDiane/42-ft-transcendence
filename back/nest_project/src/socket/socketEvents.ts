import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { send } from './chatUtils/sendMessage';
import { join } from './chatUtils/channels';
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Base64 } from "js-base64";
import * as jsrsasign from 'jsrsasign';

interface MessageChat {
    sender?: string;
    room: string;
    content: string;
}

@WebSocketGateway({transports: ['websocket']})
export class Chat implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('privateMessage')
    async handlePrivateEvent(@MessageBody() data: MessageChat, @ConnectedSocket() client: Socket): Promise<void> {
        const token = client.handshake.headers.authorization;
        console.log(client.handshake.headers, client.id, data.room, data.content);
        client.emit('message', { sender: client.id, room: data.room, content: data.content });          
    }
}
