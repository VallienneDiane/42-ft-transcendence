import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { send } from './chatUtils/sendMessage';
import { join } from './chatUtils/channels';
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

interface MessageChat {
    sender?: string;
    room: string;
    content: string;
}

@WebSocketGateway({transports: ['websocket']})
export class Chat {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('privateMessage')
    async handlePrivateEvent(@MessageBody() data: MessageChat, @ConnectedSocket() client: Socket): Promise<void> {
        const token = client.handshake.headers.authorization;
        console.log(client.handshake.headers, client.id, data.room, data.content);
        client.emit('message', { sender: client.id, room: data.room, content: data.content });          
    }
}
