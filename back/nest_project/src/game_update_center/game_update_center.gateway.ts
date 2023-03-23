import { Logger, OnModuleInit } from '@nestjs/common';
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameEngineService } from 'src/game_engine/game_engine.service';
import { PongEngineService } from 'src/pong_engine/pong_engine.service';
import { OnGatewayInit } from '@nestjs/websockets';

interface ballpos {
	x: number,
	y: number,
}

interface gameState {
	ballPosition: ballpos[],
	paddleOne: {x: number, y: number },
	paddleTwo: {x: number, y:number },
}

export class Waiting_socket {
  socket_id: Socket;
  target;
  login;
}

export class Pong {
  game_engine;
  room_id;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameUpdateCenterGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{

  Game: GameEngineService[];
  Pong: Pong[];
  room_id;
  logger: Logger = new Logger("GameGateway");
  state;
  pong_public_space: Socket[];
  game_public_space: Socket[];
  private_space: Waiting_socket[];

  constructor() {
    this.Game = [];
    this.Pong = [];
    this.state = "pong";
    this.room_id = 0;
  }

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('public matchmaking')
  handlePublicMatchmaking(client: Socket, body: any) {
    if (body === "game") {
      this.game_public_space.push(client);
      console.log("socket :" + client + "has been added to game public space");
      if (this.game_public_space.length > 1) {
        this.game_public_space[0].join(this.room_id);
        this.game_public_space[1].join(this.room_id);
        this.room_id++;
        this.game_public_space.pop();
        this.game_public_space.pop();
      }
    }
    else {
      this.pong_public_space.push(client);
      console.log("socket :" + client + "has been added to pong public space");
      if (this.pong_public_space.length > 1) {
        this.pong_public_space[0].join(this.room_id);
        this.pong_public_space[1].join(this.room_id);
        this.Pong[this.room_id].room_id = this.room_id;
        this.Pong[this.room_id].game_engine = new PongEngineService(this.pong_public_space[0], this.pong_public_space[1]);

        this.room_id++;
        this.pong_public_space.pop();
        this.pong_public_space.pop();
      }
    }
  }

  @SubscribeMessage('public matchmaking')
  handlePrivateMatchmaking(@MessageBody() body: any, client: Socket) {
    client.join("public matchmaking");
  }

  afterInit(server: Server) { // log module initialization
    this.logger.log("Initialized");
  }

  handleConnection(client: Socket, ...args: any[]) { // log client connection
    this.logger.log('client Connected: ' + client.id);
  }

  handleDisconnect(client: Socket) { // log client disconnection
    this.logger.log('client Disconnected: ' + client.id);
    
  }
  
  onModuleInit() { // output a ;essage on connection and when the programme start
    const io = require('socket.io')(this.server);
    console.log('game server starting');
    this.server.on('connection', (socket) => {
      console.log("socket ID", socket.id, 'Is connected');
    })
  }

  // @SubscribeMessage('Game_Input')
  // OnGame_Input(@MessageBody() body: any, client: Socket) { // rajouter dans le message le joueur ou prendre en compte le joueur
  //   const game = this.Game;
  //   const pong = this.Pong;
  //   if (this.state === "game") {
  //     game.ballz[0].process_input(body);
  //     this.server.emit('Game_Update', game.gs)
  //   }
  //   else if (this.state === "pong") {
  //     if (body === "ArrowUp" || body === "ArrowDown") {
  //         pong.p2.process_input(body);
  //     }
  //     else {
  //       pong.p1.process_input(body);
  //     }
  //   }
  // }

  @SubscribeMessage('Game_init')
  OnGame_init(@MessageBody() body: any) {
    if (body === "complex") {
      this.state = "game";
    }
  }

  @SubscribeMessage('joinning_room')
  handleJoinRoom(@MessageBody() body: any, client: Socket) {
    client.join(body.room);
  }

  @SubscribeMessage('leaving_room')
  handleLeaveRoom(@MessageBody() body: any, client: Socket) {
    if (body === "complex") {
      this.state = "game";
    }
  }

  // @SubscribeMessage('Game_start')
  // OnGame_start(@MessageBody() body: any) {
  //   const game = this.Game;
  //   const pong = this.Pong;
  //   const thiss = this;
  //   if (thiss.state === "game") {
  //     setInterval(function() {
  //       game.main_loop();
  //       thiss.server.emit('Game_Update', game.gs)
  //     }, 1000/60);
  //   }
  //   else {
  //     setInterval(function() {
  //       pong.main_loop();
  //       thiss.server.emit('Game_Update', pong.gs)
  //     }, 1000/60);
  //   }
  // }
}