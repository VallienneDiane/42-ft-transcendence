import { OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GameEngineService } from 'src/game_engine/game_engine.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameUpdateCenterGateway implements OnModuleInit{

	constructor(private readonly gameEngineService: GameEngineService) {}

  test = new GameEngineService;

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    const io = require('socket.io')(this.server);
    console.log('test');
    this.server.on('connection', (socket) => {
      console.log(socket.id);
      console.log('Connected');
    })
  }

  @SubscribeMessage('Game_Input')
  OnGame_Input(@MessageBody() body: any) {
    console.log(body);
    this.test.hello();
    this.server.emit('Game_Update', 'game update received')
  }

  @SubscribeMessage('Game_start')
  OnGame_start(@MessageBody() body: any) {
    console.log(body);
    setInterval(function() {
      console.log("should work");
      this.gameEngineService.main_loop();
    }, 1000/60);
    this.server.emit('Game_Update', 'game update received')
  }
}
