import { OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GameEngineService } from 'src/game_engine/game_engine.service';
import { Ball } from 'src/game_engine/Ball';

interface ballpos {
	x: number,
	y: number,
}

interface gameState {
	ballPosition: ballpos[],
	paddleOne: {x: number, y: number },
	paddleTwo: {x: number, y:number },
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameUpdateCenterGateway implements OnModuleInit{

  Game: GameEngineService;

  constructor(game: GameEngineService) {
    this.Game = game;
  }

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    const io = require('socket.io')(this.server);
    console.log('game server starting');
    this.server.on('connection', (socket) => {
      console.log("socket ID", socket.id, 'Is connected');
    })
  }

  @SubscribeMessage('Game_Input')
  OnGame_Input(@MessageBody() body: any) {
    const test = this.Game;
    this.Game.ballz[0].process_input(body);
    this.server.emit('Game_Update', test.gs)
  }

  @SubscribeMessage('Game_start')
  OnGame_start(@MessageBody() body: any) {
    const test = this.Game;
    const tost = this;
    setInterval(function() {
      test.main_loop();
      tost.server.emit('Game_Update', test.gs)
    }, 1000/60);
  }
}