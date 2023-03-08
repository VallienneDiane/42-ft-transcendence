import { OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GameEngineService } from 'src/game_engine/game_engine.service';

interface gameState {
  ballPosition: {x: number, y: number},
  paddleOne: {x: number, y: number },
  paddleTwo: {x: number, y:number }
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameUpdateCenterGateway implements OnModuleInit{
	constructor(private readonly gameEngineService: GameEngineService) {}

  private gamestate: gameState = {
    ballPosition: {x: 0.5, y: 0.5},
    paddleOne: {x: 1, y: 0.5 },
    paddleTwo: {x: 0, y: 0.5 }
  }

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    const io = require('socket.io')(this.server);
    console.log('test');
    this.server.on('connection', (socket) => {
      console.log("socket ID", socket.id, 'Is connected');
      // console.log('Connected');
    })
  }

  @SubscribeMessage('Game_Input')
  OnGame_Input(@MessageBody() body: any) {
    console.log(body);
    this.gameEngineService.ball.process_input(body);
    this.server.emit('Game_Update', this.gamestate)
  }

  @SubscribeMessage('Game_start')
  OnGame_start(@MessageBody() body: any) {
    const test = this.gameEngineService;
    console.log(body);
    setInterval(function() {
      console.log("should work");
      test.main_loop();
      this.server.emit('Game_Update', this.gamestate)
    }, 1000/60);
  }
}