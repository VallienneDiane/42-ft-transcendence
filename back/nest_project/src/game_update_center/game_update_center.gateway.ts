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

  public gamestate: gameState = {
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
    const test = this.gameEngineService;
    console.log(body);
    this.gameEngineService.ball.process_input(body);
    console.log("je t'envoye :" + test.gs);
    this.server.emit('Game_Update', test.gs)
  }

  @SubscribeMessage('Game_start')
  OnGame_start(@MessageBody() body: any) {
    const test = this.gameEngineService;
    const tost = this;
    console.log(body);
    setInterval(function() {
      console.log("devrait spammer le chat");
      test.main_loop();
      tost.server.emit('Game_Update', test.gs)
    }, 1000/60);
  }
}