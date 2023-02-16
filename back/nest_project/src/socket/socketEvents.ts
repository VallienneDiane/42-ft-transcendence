import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
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
    @SubscribeMessage('message')
    handleEvent(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
        // send an event
        this.server.emit('message', client.id, data);
    }
}