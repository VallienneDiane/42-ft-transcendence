import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';

@WebSocketGateway({transports: ['websocket']})
export class SocketEvents {
    @WebSocketServer()
    server: Server;

    //connexion
    handleConnexion(client: Socket) {
        console.log(`Client Connected: ${client.id}`);
    }

    //disconnection
    handleDisConnect(client: Socket) {
        console.log(`Client Disconnected: ${client.id}`);
    }

    //receive events
    @SubscribeMessage('ping')
    handleEvent(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
        // send an event
        console.log(data);
        this.server.emit('pong', client.id, data);
    }
}