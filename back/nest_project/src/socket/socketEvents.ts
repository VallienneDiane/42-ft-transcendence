import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';

@WebSocketGateway({transports: ['websocket']})
export class PingEvent {
    @WebSocketServer()
    server: Server;

    //receive events
    @SubscribeMessage('ping')
    handleEvent(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
        // send an event
        console.log(client.id + data);
        this.server.emit('pong', client.id, data);
    }

}

@WebSocketGateway({transports: ['websocket']})
export class Chat {
    @WebSocketServer()
    server: Server;

    currentChat: string[] = [];
    @SubscribeMessage('message')
    handleEvent(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
        console.log('message to add from ' + client.id + ' : ' + data);
        this.currentChat.push(client.id);
        this.currentChat.push(data);
        this.server.emit('newMessage', ...this.currentChat);
    }
}