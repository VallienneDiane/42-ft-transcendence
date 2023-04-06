import { Logger, OnModuleInit } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameEngineService } from 'src/game_engine/game_engine.service';
import { PongEngineService } from 'src/pong_engine/pong_engine.service';
import { OnGatewayInit } from '@nestjs/websockets';

/**
 * use to send a private matchmaking request
 */
interface Private_order {
  target: string,
  type: string,
}

/**
 * use in the waiting room for private matchmaking store
 */
export class Waiting_socket {
  socket: Socket;
  target: string;
  game: string;
}

/**
 * struct use to store a pong game instance
 */
export class Pong_instance {
  game_engine: any;
  player: Socket[];
  spectator: Socket[];
}

/**
 * struct use to store a game game instance
 */
export class Game_instance {
  game_engine: any;
  player: Socket[];
  spectator: Socket[];
}

/**
 * use to share the player login at the start of a match
 */
export class Players {
  login1: string;
  login2: string;
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
    this.game_public_space = [];
    this.private_space = [];
    this.socket_login = new Map<string, string>();
  }

  @WebSocketServer()
  server: Server;
  /**
   * take the socket in the public game room and shove them into a room to start a game instance for them
   * @param client the second player socket
   */
  StartGameRoom(@ConnectedSocket() player1: Socket, @ConnectedSocket() player2: Socket, type: string) {
    // make the player join the room of name player1.socket.id
    console.log("test:" + player1);
    player1.join(player1.id);
    player2.join(player1.id);

    // set a game instance for the player and add it to the game instance []
    let p = new Game_instance();
    if (type === "game") {
      p.game_engine = new GameEngineService();
    }
    else {
      p.game_engine = new PongEngineService();
    }
    p.game_engine.set_player(player1, player2);
    p.player = [];
    p.spectator = [];
    p.player.push(player1);
    p.player.push(player2);
    this.game_instance.push(p);

    // emit the Player struct to the front to display the player login
    let players = new Players();
    players.login1 = this.socket_login.get(player1.id);
    players.login2 = this.socket_login.get(player2.id);
    this.server.to(player1.id).emit('players', players);
    this.logger.debug("a game room has been created");
  }

  /**
   * 
   * @param client the client's socket wanting to join a public matchmaking room
   * @param body anything will start pong execpt if the string === "game"
   */
  @SubscribeMessage('public matchmaking')
  handlePublicMatchmaking(@ConnectedSocket() client: Socket, body: any) {
    if (body === "game" && this.game_public_space[0] != client) {
      this.game_public_space.push(client);
      this.logger.debug("socket :" + client.id + "has been added to game public space");
      if (this.game_public_space.length > 1) {
        this.StartGameRoom(this.game_public_space[0], client, "game");
        this.game_public_space.pop();
        this.game_public_space.pop();
        this.logger.debug("game room created");
      }
    }
    else if (this.pong_public_space[0] != client) {
      this.pong_public_space.push(client);
      this.logger.debug("socket :" + client.id + "has been added to pong public space");
      if (this.pong_public_space.length > 1) {
        console.log("heu..." + this.game_public_space[0]);
        this.StartGameRoom(this.pong_public_space[0], client, "");
        this.pong_public_space.pop();
        this.pong_public_space.pop();
        this.logger.debug("pong room created");
      }
    }
  }

  /**
   * 
   * @param body the login associated with the socket
   * @param client the soket of the client
   */
  @SubscribeMessage('handshake')
  handlehandsshake(@MessageBody() body: string, @ConnectedSocket() client: Socket) {
    console.log("client : " + client.id + "has this pseudo :" + body);
    this.socket_login.set(client.id, body); // map the socket to a login
  }

  /**
   * check witch game instance the player ready is in, and set the engin state accordingly,
   * launching the engin loop automaticaly if both player are ready
   * @param client the client clicking on the ready button (Socket from socket.io)
   */
  @SubscribeMessage('ready')
  handleReady(@ConnectedSocket() client: Socket) {
    for (let i = 0; i < this.game_instance.length; i++) {
      const element = this.game_instance[i];
      for (let j = 0; j < element.player.length; j++) {
        const player = element.player[j];
        if (player === client) {
          element.game_engine.set_player_ready(player, this.server)
        }
      }
    }
    for (let i = 0; i < this.pong_instance.length; i++) {
      const element = this.pong_instance[i];
      for (let j = 0; j < element.player.length; j++) {
        const player = element.player[j];
        if (player === client) {
          element.game_engine.set_player_ready(player, this.server)
        }
      }
    }
  }
  
  afterInit(server: Server) { // log module initialization
    this.logger.log("Initialized");
  }

  handleConnection(@ConnectedSocket() client: Socket, ...args: any[]) { // log client connection
    this.logger.debug('client Connected: ' + client.id);
  }

  /**
   * find and remove the disconnected client from relevante struc,
   * stop the current match if necessary, and remove the client from known loggin
   * @param client the client disconnected
   */
  handleDisconnect(@ConnectedSocket() client: Socket) { // log client disconnection
    this.logger.log('client Disconnected: ' + client.id);
    this.find_and_remove(client);
    this.socket_login.delete(client.id);
  }

  /**
   * 
   * @param client find the client and do the necessary clean-up
   * @returns 
   */
  find_and_remove(@ConnectedSocket() client: Socket) {

    // if the client is in a game
    game: for (let i = 0; i < this.game_instance.length; i++) {
      const element = this.game_instance[i];
      for (let j = 0; j < element.spectator.length; j++) {
        const spec = element.spectator[j];
        if (client === spec) {
          this.server.to(element.player[0].id).emit('spectateur disconnected');
          element.spectator.splice(j, 1);
          break game;
        }
      }
      for (let j = 0; j < element.player.length; j++) {
        const player = element.player[j];
        if (player === client) {
          this.server.to(element.player[0].id).emit('player_disconnection', this.socket_login.get(player.id));
          element.game_engine.stop_game();
          this.pong_instance.splice(i, 1);
          break game;
        }
      }
    }

    // if the client is in a pong
    pong: for (let i = 0; i < this.pong_instance.length; i++) {
      const element = this.pong_instance[i];
      for (let j = 0; j < element.spectator.length; j++) {
        const spec = element.spectator[j];
        if (client === spec) {
          this.server.to(element.player[0].id).emit('spectateur disconnected');
          element.spectator.splice(j, 1);
          break pong;
        }
      }
      for (let j = 0; j < element.player.length; j++) {
        const player = element.player[j];
        if (player === client) {
          this.server.to(element.player[0].id).emit('player_disconnection', this.socket_login.get(player.id));
          element.game_engine.stop_game();
          this.pong_instance.splice(i, 1);
          break pong;
        }
      }
    }

    // if the client was in pong_public_space
    for (let i = 0; i < this.pong_public_space.length; i++) {
      const element = this.pong_public_space;
      if (element[i] === client) {
        element.splice(i, 1);
        break;
      }
    }

    // if the client was in game_public_space
    for (let i = 0; i < this.game_public_space.length; i++) {
      const element = this.game_public_space;
      if (element[i] === client) {
        element.splice(i, 1);
        break;
      }
    }

    // if the client was waiting for a private match
    for (let i = 0; i < this.private_space.length; i++) {
      const element = this.private_space;
      if (element[i].socket === client) {
        element.splice(i, 1);
        break;
      }
    }
  }
 
  /**
   * handle invitation to a pong/game game
   * @param body of private_order type containing a target: string and a type: string
   * @param client the client posting the request
   * @returns nothing
   */
  @SubscribeMessage('private matchmaking')
  handlePrivateMatchmaking(@MessageBody() body: Private_order, @ConnectedSocket() client: Socket) { //TODO make it work
    for (let i = 0; i < this.private_space.length; i++) {
      const element = this.private_space[i];
      if (element.socket === client) {
        this.logger.debug("already waiting" + element);
        return;
      }
      console.log(body);
      if (element.target === this.socket_login.get(client.id) && body.target === this.socket_login.get(element.socket.id)) {
        this.logger.debug("oui !!!");
        this.StartGameRoom(element.socket, client, body.type);
        this.private_space.splice(i, 1);
        return;
      }
    }
    this.logger.debug("not waiting so create a new wait order" + body);
    let private_room = new Waiting_socket();
    private_room.socket = client;
    private_room.target = body.target;
    private_room.game = body.type;
    this.logger.debug("resulting in this object: game: " + private_room.game +"\n"+ private_room.socket.id +"\n"+ private_room.target);
    this.private_space.push(private_room);
  }

  /**
   * process the input if the client is a player
   * @param body the input of the client
   * @param client the client
   */
  @SubscribeMessage('Game_Input')
  OnGame_Input(@MessageBody() body: any, @ConnectedSocket() client: Socket) {
    // if the client is in game
    game: for (let i = 0; i < this.game_instance.length; i++) {
      const element = this.game_instance[i];
      for (let j = 0; j < element.player.length; j++) {
        const player = element.player[j];
        if (player === client) {
          this.logger.debug("client.id inputed" + body);
          element.game_engine.process_input(client, body);
          break game;
        }
      }
    }

    // if the client is in a pong
    pong: for (let i = 0; i < this.pong_instance.length; i++) {
      const element = this.pong_instance[i];
      for (let j = 0; j < element.player.length; j++) {
        const player = element.player[j];
        if (player === client) {
          this.logger.debug("client.id inputed" + body);
          element.game_engine.process_input(client, body);
          break pong;
        }
      }
    }
  }
}