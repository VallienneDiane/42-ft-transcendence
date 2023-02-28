// import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
// import { Server, Socket } from 'socket.io';
// import { UseGuards } from "@nestjs/common";
// import { AuthGuard } from "@nestjs/passport";

// import * as jsrsasign from 'jsrsasign';

// interface MessageChat {
//     sender?: string;
//     room: string;
//     content: string;
// }

// @WebSocketGateway({transports: ['websocket']})
// export class Chat implements OnGatewayConnection, OnGatewayDisconnect {
//     @WebSocketServer()
//     server: Server;

//     handleConnection(client: Socket) {
//         console.log(jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login + ' is connected to chat' || "null");
//     }

//     handleDisconnect(client: Socket) {

//     }

    // @UseGuards(AuthGuard('jwt'))
//     @SubscribeMessage('privateMessage')
//     async handlePrivateEvent(@MessageBody() data: MessageChat, @ConnectedSocket() client: Socket): Promise<void> {
//         //let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj;
//         console.log((client.handshake), client.id, data.room, data.content);
//         client.emit('message', { sender: client.id, room: data.room, content: data.content });          
//     }
// }
