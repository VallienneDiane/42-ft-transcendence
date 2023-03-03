import { OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GameEngineService } from 'src/game_engine/game_engine.service';

@WebSocketGateway()
export class GameUpdateCenterGateway implements OnModuleInit{

	constructor(private readonly gameEngineService: GameEngineService) {}

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
      console.log('Connected');
    })
  }

  @SubscribeMessage('Game_Input')
  OnGame_Input(@MessageBody() body: any) {
    console.log(body);
    this.gameEngineService.hello();
    this.server.emit('Game_Update', 'game update received')
  }
}
