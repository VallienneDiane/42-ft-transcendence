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

export class Pong_instance {
  game_engine;
  player: Socket[];
  spectator: Socket[];
}

export class Game_instance {
  game_engine;
  player: Socket[];
  spectator: Socket[];
}

export class Players {
  l1: string;
  l2: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameUpdateCenterGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{

  game_instance: Game_instance[];
  pong_instance: Pong_instance[];
  logger: Logger = new Logger("GameGateway");
  state;
  pong_public_space: Socket[];
  game_public_space: Socket[];
  private_space: Waiting_socket[];
  socket_login: Map<string, string>;

  constructor() {
    this.game_instance = [];
    this.pong_instance = [];
    this.pong_public_space = [];
    this.state = "pong";
  }

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('public matchmaking')
  handlePublicMatchmaking(client: Socket, body: any) {
    if (body === "game") {
      this.game_public_space.push(client);
      console.log("socket :" + client + "has been added to game public space");
      if (this.game_public_space.length > 1) {
        let player1 = this.game_public_space[0];
        let player2 = this.game_public_space[1];

        player1.join(player1.id);
        player2.join(player1.id);

        let p = new Game_instance();
        p.game_engine = new GameEngineService();
        p.game_engine.set_player(player1, player2);
        p.player.push(player1);
        p.player.push(player2);
        this.game_instance.push(p);

        let players = new Players();
        players.l1 = this.socket_login[player1.id];
        players.l2 = this.socket_login[player2.id];
        this.server.to(player1.id).emit('players', players);

        console.log(player1.id + " and : " +player2.id + "where moved in the game room : " + player1.id);

        this.game_public_space.pop();
        this.game_public_space.pop();
      }
    }
    else {
      this.pong_public_space.push(client);
      console.log("socket :" + client + "has been added to pong public space");
      if (this.pong_public_space.length > 1) {
        let player1 = this.pong_public_space[0];
        let player2 = this.pong_public_space[1];

        player1.join(player1.id);
        player2.join(player1.id);

        let p = new Pong_instance();
        p.game_engine = new PongEngineService();
        p.game_engine.set_player(player1, player2);
        p.player.push(player1);
        p.player.push(player2);
        this.pong_instance.push(p);

        let players = new Players();
        players.l1 = this.socket_login[player1.id];
        players.l2 = this.socket_login[player2.id];
        this.server.to(player1.id).emit('players', players);

        console.log(player1.id + " and : " +player2.id + "where moved in the pong room : " + player1.id);

        this.pong_public_space.pop();
        this.pong_public_space.pop();
      }
    }
  }

  @SubscribeMessage('handshake')
  handlehandsshake(@MessageBody() body: string, client: Socket) {
    this.socket_login[client.id] = body;
  }

  // @SubscribeMessage('ready')
  // handleReady(client: Socket) {
  //   this.game_instance.forEach(element => {
  //     if (element.player.forEach);
  //   });
  // }

  @SubscribeMessage('private matchmaking')
  handlePrivateMatchmaking(@MessageBody() body: any, client: Socket) {
    client.join("private matchmaking");
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