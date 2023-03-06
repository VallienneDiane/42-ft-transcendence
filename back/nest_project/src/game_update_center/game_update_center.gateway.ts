import { OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jsrsasign from 'jsrsasign';


@WebSocketGateway({transports: ['websocket'], namespace: '/game'})
export class GameUpdateCenterGateway implements OnModuleInit{

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log('ICI', socket.id);
      console.log('Connected');
    })
  }

  handleConnection(client: Socket) {
		// if (client.handshake.auth['token'] != null) {
			let pseudo = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj!.login;
			console.log(pseudo + ' is connected to the GAME.');
		// }
  }

  @SubscribeMessage('Game_Input')
  OnGame_Input(@MessageBody() body: any) {
    console.log(body);
    this.server.emit('Game_Update', 'game update received')
  }
}
