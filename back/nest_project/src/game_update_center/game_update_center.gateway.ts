/**
 * this file contain all of the game socket logistic and event handling like disconnection and input
 */

import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'; // socket event handling stuff
import { GameInputDTO, PrivateGameRequestDTO, PublicGameRequestDTO } from './game_update_center.dto'; // all the DTO (struct use to verified field of incoming request)
import { GameEngineService } from 'src/game_engine/game_engine.service'; // use to acces the gameEngine of the super mode
import { PongEngineService } from 'src/pong_engine/pong_engine.service'; // use to acces the gameEngine of the classic mode
import { MatchService } from 'src/match/Match.service'; // use to acces function for the MatchEntity in the gameEngine to store goal
import { UserService } from 'src/user/user.service'; // use to acces function for the UserEntity in the gameEngine to store goal
import { OnGatewayInit } from '@nestjs/websockets'; // use to log the initialization of the module
import { UserEntity } from "src/user/user.entity"; // use to access UserEntity table
import { IToken } from 'src/chat/chat.interface'; // use for token
import { Server, Socket } from 'socket.io'; // use to manage socket and emit message
import { JwtService } from '@nestjs/jwt'; // use for token
import { Logger } from '@nestjs/common'; // use for log
import * as jsrsasign from 'jsrsasign'; // use for token validation

/**
 * use for storing waiting client
 */
class Waiting_Socket {
  waiting_client_socket: Socket;
  target_client_login: string;
  super_game_mode: boolean;
}

/**
 * struct use to store all game instance
 */
class Game_Instance {
  game_engine: any;
  players: Socket[];
  spectators: Socket[];
}

/**
 * use to share players login at the start of a game
 */
class Login_Sharing {
  player1_login: string;
  player2_login: string;
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

  // logistic things
  socketID_UserEntity: Map<string, UserEntity>; // map all the socket with their UserEntity for faster acces to user data
  logger: Logger = new Logger("GameGateway"); // use to log thing into the console (inside the container)

  // storing game request and instance thing
  game_instance: Game_Instance[]; // all gane instance
  private_space: Waiting_Socket[]; // waiting room for private matchmaking
  public_space: Waiting_Socket[]; // waiting room for public matchmaking

  constructor(
    private userservice: UserService, // injecting instance of service to be use for token verification and match's goal storing purpuse
    private matchservice: MatchService,
    private jwtservice: JwtService
  ) 
  {
    // basic initialization
    this.socketID_UserEntity = new Map<string, UserEntity>();
    this.game_instance = [];
    this.public_space = [];
    this.private_space = [];
  }

  /**
   * the big socket manager thing
   */
  @WebSocketServer()
  server: Server;

  /**
   * start a game instance for the player 1 and 2 to play together
   * @param player1 the Socket from socket.io of player1
   * @param player2 the Socket from socket.io of player2
   * @param super_game_mode the boolean representing the super_game_mode version of the game
   */
  StartGameRoom(@ConnectedSocket() player1: Socket, @ConnectedSocket() player2: Socket, super_game_mode: boolean) {
    console.log("entering StartGameRoom function");
    // make the player join the room of name player1.socket.id
    player1.join(player1.id);
    player2.join(player1.id);

    // Start ---------- set a game instance for the player and add it to the game instance [] ----------
  
    // creating the game instance with the correct gameEngine and service for storing goal
    let p = new Game_Instance();
    if (super_game_mode === true) { p.game_engine = new GameEngineService(this.userservice, this.matchservice); }
    else { p.game_engine = new PongEngineService(this.userservice, this.matchservice); }
  
    // setting the player and UserEntity of player for the gameEngine
    p.game_engine.set_player(player1, player2, this.socketID_UserEntity.get(player1.id), this.socketID_UserEntity.get(player2.id));
    p.players = [];
    p.spectators = [];
    p.players.push(player1);
    p.players.push(player2);
    console.log("the game instance added to the game instance : ", p);
    this.game_instance.push(p);
    // End ---------- set a game instance for the player and add it to the game instance [] ----------


    // emit the Player struct to the front to display the player login
    let players = new Login_Sharing();
    players.player1_login = this.socketID_UserEntity.get(player1.id).login;
    players.player2_login = this.socketID_UserEntity.get(player2.id).login;
    this.server.to(player1.id).emit('players', players);
    this.logger.debug("a game room has been created");
    console.log("leaving StartGameRoom function");
  }
  
  /**
   * match two player according to the game type they want to play
   * @param client the client Socket
   * @param body a PublicGameRequestDTO containing the game type that the user want to play
   * @returns nothing
   */
  @SubscribeMessage('public matchmaking')
  handlePublicMatchmaking(@ConnectedSocket() client: Socket,@MessageBody() body: PublicGameRequestDTO) {
    console.log("entering handlePublicMatchmaking function");

    // check if there is already a waiting socket for a potential matchmaking
    for (let index = 0; index < this.public_space.length; index++) {
      const element = this.public_space[index];

      // if a waiting socket with the same game_mode is already waiting
      if (element.super_game_mode === body.super_game_mode) {
        this.logger.debug("client : ", element.waiting_client_socket.id, "and client : ", client.id, "have been match together in a game instance with super_game_mode : ", body.super_game_mode);

        // create a game instance for them
        this.StartGameRoom(element.waiting_client_socket, client, body.super_game_mode);

        // remove the waiting socket from the queu
        this.public_space.splice(index, 1);
        this.logger.debug("game room created");
        return;
      }
    }

    // if no socket where waiting or no match of mode where found add the socket to the waiting socket list
    let ws: Waiting_Socket = new Waiting_Socket();
    ws.super_game_mode = body.super_game_mode;
    ws.waiting_client_socket = client;
    ws.target_client_login = "";
    console.log("the waiting socket to be added", ws);
    this.public_space.push(ws);
    console.log("leaving handlePublicMatchmaking function");
  }

  /**
   * find in witch game instance the client is a player and toggle his ready state
   * @param client the Socket from Socket.io
   */
 @SubscribeMessage('ready')
  handleReady(@ConnectedSocket() client: Socket) { // TODO check on the engine side what happen if the player send a ready message in a ongoing match
    
    console.log("entering handleReady function");
    for (let i = 0; i < this.game_instance.length; i++) {
      const game = this.game_instance[i];
      for (let j = 0; j < game.players.length; j++) {
        const player = game.players[j];
        if (player === client) {
          game.game_engine.set_player_ready(player, this.server);
          return;
        }
      }
    }
    console.log("leaving handleReady function");
  }

  /**
   * happend on connection to the game page
   * @param client the socket connecting
   */
  async handleConnection(@ConnectedSocket() client: Socket) {
    
    // checking if the socket have a valid token
    let user_entity = await this.tokenChecker(client);
  
    // if not remove him
    if (user_entity === null) { // TODO test if it work
      console.log("user_entity : ", user_entity, "has no valide token and so was kicked");
      client.leave(client.id);
    }

    // if token is ok then store the UserEntity for quick acces
    this.socketID_UserEntity.set(client.id, user_entity);
    this.logger.debug("client Connected, socket id : ", client.id, "\n client login", user_entity.login);
  }
  
  /**
   * find and remove the disconnected client from relevante struc,
   * stop the current match if necessary, and remove the client from known socket
   * @param client the client disconnected
   */
  handleDisconnect(@ConnectedSocket() client: Socket) { // log client disconnection
    this.logger.log('client Disconnected: ', client.id);
    this.find_and_remove(client);
    if (this.socketID_UserEntity.delete(client.id) === false) {
      this.logger.debug("Critical logic error, trying to removed a client that doesn't exist");
    }
  }

  /**
   * find and remove the client from the correct struct, stopping the game if needed
   * @param client the client who got disconnected
   * @returns 
  */
  find_and_remove(@ConnectedSocket() client: Socket) {
    console.log("entering find_and_remove function");

    // check if the client is in a ongoing game
    for (let i = 0; i < this.game_instance.length; i++) {
      const game = this.game_instance[i];

      // if the client is a spectator
      for (let j = 0; j < game.spectators.length; j++) { // TODO update the room if nessessary
        const spec = game.spectators[j];
        if (client === spec) {
          this.server.to(game.players[0].id).emit('spectator_disconnection');
          game.spectators.splice(j, 1);
          console.log("leaving find_and_remove function finding a spectator to be removed");
          return;
        }
      }

      // if the client is a player
      for (let j = 0; j < game.players.length; j++) {
        const player = game.players[j];
        if (player === client) {
          this.server.to(game.players[0].id).emit('player_disconnection', this.socketID_UserEntity.get(player.id).login);
          game.game_engine.stop_game();
          this.game_instance.splice(i, 1);
          console.log("leaving find_and_remove function having found a player and stoping the ongoing game");
          return;
        }
      }
    }
    
    // if the client was in public_space
    for (let i = 0; i < this.public_space.length; i++) {
      const ws = this.public_space[i];
      if (ws.waiting_client_socket === client) {
        this.public_space.splice(i, 1);
        console.log("leaving find_and_remove function having find a waiting socket in public_space");
        return;
      }
    }

    // if the client was waiting for a private match
    for (let i = 0; i < this.private_space.length; i++) {
      const ws = this.private_space[i];
      if (ws.waiting_client_socket === client) {
        this.private_space.splice(i, 1);
        console.log("leaving find_and_remove function having find a waiting socket in private_space");
        return;
      }
    }

    console.log("leaving find_and_remove function");
  }
  
  /**
   * handle private invitation
   * @param body a PrivateGameRequestDTO containing a non empty target string and a super_game_mode boolean
   * @param client the client posting the request
   * @returns nothing
   */
  @SubscribeMessage('private matchmaking')
  handlePrivateMatchmaking(@MessageBody() body: PrivateGameRequestDTO, @ConnectedSocket() client: Socket) {
    console.log("entering handlePrivateMatching function");

    // check the existing waiting socket to find a potential match
    for (let i = 0; i < this.private_space.length; i++) {
      const private_waiting_socket = this.private_space[i];
      // catch the same socket from playing with himself
      if (private_waiting_socket.waiting_client_socket === client) {
        this.logger.debug("socketID : ", private_waiting_socket.waiting_client_socket.id, "was already waiting");
        return;
      }
      // if match
      else if (private_waiting_socket.target_client_login === this.socketID_UserEntity.get(client.id).login && body.target === this.socketID_UserEntity.get(private_waiting_socket.waiting_client_socket.id).login) {
        this.logger.debug("private matchmaking occuring");
        // creat the game instance
        this.StartGameRoom(private_waiting_socket.waiting_client_socket, client, body.super_game_mode);

        // remove the waiting socket from the waiting space
        this.private_space.splice(i, 1);
        console.log("leaving handlePrivateMatching function");
        return;
      }
    }

    // if no match where found add the private game request to the queu
    this.logger.debug("no match where found, socket is now waiting for target to accept invit in a super_game_mode : ", body.super_game_mode);
    let private_room = new Waiting_Socket();
    private_room.waiting_client_socket = client;
    private_room.target_client_login = body.target;
    private_room.super_game_mode = body.super_game_mode;
    this.logger.debug("resulting in this object: super_game_mode: ", private_room.super_game_mode, "\n waiting socket", private_room.waiting_client_socket.id, "\n target : ", private_room.target_client_login);
    this.private_space.push(private_room);

    console.log("leaving handlePrivateMatching function");
  }

  /**
   * process the input if the client is a player
   * @param body the input of the client containg one non empty string
   * @param client the client
  */
  @SubscribeMessage('Game_Input')
  OnGame_Input(@MessageBody() body: GameInputDTO, @ConnectedSocket() client: Socket) {
    // if the client is in game
    for (let i = 0; i < this.game_instance.length; i++) {
      const game = this.game_instance[i];
      for (let j = 0; j < game.players.length; j++) {
        const player = game.players[j];
        if (player === client) {
          this.logger.debug("client.id : ", client.id, "inputed", body.input);
          game.game_engine.process_input(client, body.input);
          return;
        }
      }
    }
  }

  /**
   * nicolas' function
   * @param client 
   * @returns 
   */
  private extractUserId(client: Socket): string {
    let token = client.handshake.auth['token'];
    if (token != null) {
        try {
            const decoded = this.jwtservice.verify(token, {
                secret: process.env.SECRET,
        });
        }
        catch (error) {
            return (null);
        }
    }
    let object : IToken = undefined;
    if (token != null)
        object = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj;
    if (object == undefined) {
        client.emit("fromServerMessage", "you're token is invalid");
        return null;
    }
    let id: string = object.sub;
    return id;
  }

  /**
   * nicolas' function
   * @param client 
   * @returns 
   */
  private tokenChecker(client: Socket): Promise<UserEntity> {
    let id = this.extractUserId(client);
    // this.logger.debug(`${id}`)
    return this.userservice.findById(id);    
  }

  /**
   * just loging the initialization of the module
   */
  afterInit() {
    this.logger.debug("GameupdateCenter correctly initialized");
  }
}