import { OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GameEngineService } from 'src/game_engine/game_engine.service';
import { PongEngineService } from 'src/pong_engine/pong_engine.service';

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
  Pong: PongEngineService;
  state;

  constructor() {
    this.Game = new GameEngineService();
    this.Pong = new PongEngineService();
    this.state = "game";
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

  @SubscribeMessage('Game_init')
  OnGame_init(@MessageBody() body: any) {
    if (body === "simple") {
      this.state = "pong";
    }
  }

  @SubscribeMessage('Game_start')
  OnGame_start(@MessageBody() body: any) {
    const game = this.Game;
    const pong = this.Pong;
    const thiss = this;
    if (thiss.state === "game") {
      setInterval(function() {
        game.main_loop();
        thiss.server.emit('Game_Update', game.gs)
      }, 1000/60);
    }
    else {
      setInterval(function() {
        pong.main_loop();
        thiss.server.emit('Game_Update', pong.gs)
      }, 1000/60);
    }
  }
}