import { Logger, OnModuleInit } from '@nestjs/common';
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameEngineService } from 'src/game_engine/game_engine.service';
import { PongEngineService } from 'src/pong_engine/pong_engine.service';
import { OnGatewayInit } from '@nestjs/websockets';

/**
 * struct use to share the ball position
 */
interface ballpos {
	x: number,
	y: number,
}

/**
 * struct use to share the game state
 */
interface gameState {
	ballPosition: ballpos[],
	paddleOne: {x: number, y: number },
	paddleTwo: {x: number, y:number },
}

/**
 * use in the waiting room for private matchmaking store
 */
export class Waiting_socket {
  socket_id: Socket;
  target;
  game;
  login;
}

/**
 * struct use to store a pong game instance
 */
export class Pong_instance {
  game_engine;
  player: Socket[];
  spectator: Socket[];
}

/**
 * struct use to store a game game instance
 */
export class Game_instance {
  game_engine;
  player: Socket[];
  spectator: Socket[];
}

/**
 * use to share the player login at the start of a match
 */
export class Players {
  l1: string;
  l2: string;
}

/**
 * main class regrouping all thing related to soket receiving and sending stuff
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameUpdateCenterGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{

  game_instance: Game_instance[]; // all gane instance
  pong_instance: Pong_instance[]; // all pong instance
  logger: Logger = new Logger("GameGateway"); // use to log thing into the console (inside the container)
  pong_public_space: Socket[]; // waiting room for pong public matchmaking
  game_public_space: Socket[]; // waiting room for game public matchmaking
  private_space: Waiting_socket[]; // waiting room for private matchmaking
  socket_login: Map<string, string>; // map all the socket with their login

  constructor() {
    this.game_instance = [];
    this.pong_instance = [];
    this.pong_public_space = [];
  }

  @WebSocketServer()
  server: Server;
  /**
   * take the socket in the public game room and shove them into a room to start a game instance for them
   * @param client the second player socket
   */
  startgameroom(client: Socket) {
    // shortcut
    let player1 = this.game_public_space[0];
    let player2 = this.game_public_space[1];

    // make the player join the room of name player1.socket.id
    player1.join(player1.id);
    player2.join(player1.id);

    // set a game instance for the player and add it to the game instance []
    let p = new Game_instance();
    p.game_engine = new GameEngineService();
    p.game_engine.set_player(player1, player2);
    p.player.push(player1);
    p.player.push(player2);
    this.game_instance.push(p);

    // emit the Player struct to the front to display the player login
    let players = new Players();
    players.l1 = this.socket_login[player1.id];
    players.l2 = this.socket_login[player2.id];
    this.server.to(player1.id).emit('players', players);

    // debug line
    console.log(player1.id + " and : " +player2.id + "where moved in the game room : " + player1.id);

    // remove the player frome the waiting room
    this.game_public_space.pop();
    this.game_public_space.pop();
  }

  /**
   * take the socket in the public pong room and shove them into a room to start a pong instance for them
   * @param client the second player socker
   */
  startpongroom(client: Socket) {
    // shortcut
    let player1 = this.pong_public_space[0];
    let player2 = this.pong_public_space[1];

    // make the player join the room of name player1.socket.id
    player1.join(player1.id);
    player2.join(player1.id);

    // set a pong instance for the player and add it to the pong instance []
    let p = new Pong_instance();
    p.game_engine = new PongEngineService();
    p.game_engine.set_player(player1, player2);
    p.player.push(player1);
    p.player.push(player2);
    this.pong_instance.push(p);

    // emit the Player struct to the front to display the player login
    let players = new Players();
    players.l1 = this.socket_login[player1.id];
    players.l2 = this.socket_login[player2.id];
    this.server.to(player1.id).emit('players', players);

    // debug line
    console.log(player1.id + " and : " +player2.id + "where moved in the pong room : " + player1.id);

    // remove the player frome the waiting room
    this.pong_public_space.pop();
    this.pong_public_space.pop();
  }

  /**
   * 
   * @param client the client's socket wanting to join a public matchmaking room
   * @param body anything will start pong execpt if the string === "game"
   */
  @SubscribeMessage('public matchmaking')
  handlePublicMatchmaking(client: Socket, body: any) {
    if (body === "game") {
      this.game_public_space.push(client);
      console.log("socket :" + client + "has been added to game public space");
      if (this.game_public_space.length > 1) {
        this.startgameroom(client);
      }
    }
    else {
      this.pong_public_space.push(client);
      console.log("socket :" + client + "has been added to pong public space");
      if (this.pong_public_space.length > 1) {
        this.startpongroom(client);
      }
    }
  }

  /**
   * 
   * @param body the login associated with the socket
   * @param client the soket of the client
   */
  @SubscribeMessage('handshake')
  handlehandsshake(@MessageBody() body: string, client: Socket) {
    this.socket_login[client.id] = body; // map the socket to a login
  }

  @SubscribeMessage('ready')
  handleReady(client: Socket) {
    this.game_instance.forEach(element => {
      element.player.forEach(player => {
        if (client === player) {
          element.game_engine.set_player_ready(player);
        }
      });
    });
    this.pong_instance.forEach(element => {
      element.player.forEach(player => {
        if (client === player) {
          element.game_engine.set_player_ready(player);
        }
      });
    });
  }

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