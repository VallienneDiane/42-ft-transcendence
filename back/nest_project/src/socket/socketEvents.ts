import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { send } from './chatUtils/sendMessage';
import { join } from './chatUtils/channels';


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

    @SubscribeMessage('chat')
    handleEvent(@MessageBody() data: string[3], @ConnectedSocket() client: Socket) {
        console.log(client.id , ...data);
        switch (data[0])
        {
            case 'send' :
                send(data[1], data[2], this.server, client);
                break;
            case 'join' :
                join(data[1], data[2], this.server, client);
                break;
            default :
                client.emit('wrong argument');
        }
    }
}