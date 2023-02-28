import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { send } from './chatUtils/sendMessage';
import { join } from './chatUtils/channels';
import { Base64 } from "js-base64";
import * as jsrsasign from 'jsrsasign';


@WebSocketGateway({transports: ['websocket']}) // gateway is listening
export class PingEvent {
    @WebSocketServer() // create websocket server
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
export class Chat implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        // console.log(jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login + ' is connected to chat');
    }

    handleDisconnect(client: Socket) {
        // console.log(jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login + ' disconnected');
    }

    @SubscribeMessage('chat')
    handleEvent(@MessageBody() data: string[], @ConnectedSocket() client: Socket) {
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