/**
 * this file contain all of the game socket logistic and event handling like disconnection and input
 */

import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'; // socket event handling stuff
import { GameInputDTO, PrivateGameRequestDTO, PublicGameRequestDTO, SpectatorRequestDTO } from './game_update_center.dto'; // all the DTO (struct use to verified field of incoming request)
import { GameEngineService } from 'src/game_engine/game_engine.service'; // use to acces the gameEngine of the super mode
import { PongEngineService } from 'src/pong_engine/pong_engine.service'; // use to acces the gameEngine of the classic mode
import { MatchService } from 'src/match/Match.service'; // use to acces function for the MatchEntity in the gameEngine to store goal
import { UserService } from 'src/user/user.service'; // use to acces function for the UserEntity in the gameEngine to store goal
import { OnGatewayInit } from '@nestjs/websockets'; // use to log the initialization of the module
import { UserEntity } from "src/user/user.entity"; // use to access UserEntity table
import { IToken } from 'src/chat/chat.interface'; // use for token
import { Server, Socket } from 'socket.io'; // use to manage socket and emit message
import { JwtService } from '@nestjs/jwt'; // use for token
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common'; // use for log
import * as jsrsasign from 'jsrsasign'; // use for token validation
import { Client } from 'socket.io/dist/client';

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
  game_has_ended: boolean;
}

/**
 * use to share players login at the start of a game
 */
class Login_Sharing {
  player1_login: string;
  player2_login: string;
}

/**
 * use to store the match state
 */
interface MatchState {
  player1_login: string;
  player2_login: string;
  player1_score: number;
  player2_score: number;
  super_game_mode: boolean;
  game_has_started: boolean;
}

/**
 * main class regrouping all thing related to soket receiving and sending stuff
 */
@UsePipes(new ValidationPipe({enableDebugMessages: true, forbidNonWhitelisted: true, stopAtFirstError: true}))
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameUpdateCenterGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect{

  // logistic things
  socketID_UserEntity: Map<string, UserEntity>; // map all the socket with their UserEntity for faster acces to user data
  login_to_nbr_of_active_socket: Map<string, number>;
  logger: Logger = new Logger("GameGateway"); // use to log thing into the console (inside the container)

  // storing game request and instance thing
  game_instance: Game_Instance[]; // all gane instance
  private_space: Waiting_Socket[]; // waiting room for private matchmaking
  public_space: Waiting_Socket[]; // waiting room for public matchmaking
  waiting_on_match: Set<string>;
  all_the_match: MatchState[];

  /**
   * the big socket manager thing
   */
  @WebSocketServer()
  server: Server;

  constructor(
    private userservice: UserService, // injecting instance of service to be use for token verification and match's goal storing purpuse
    private matchservice: MatchService,
    private jwtservice: JwtService
  ) 
  {
    // basic initialization
    this.socketID_UserEntity = new Map<string, UserEntity>();
    this.login_to_nbr_of_active_socket = new Map<string, number>;
    this.game_instance = [];
    this.public_space = [];
    this.private_space = [];
    this.waiting_on_match = new Set<string>();
    this.all_the_match = [];
  }
  
  /**
   * just loging the initialization of the module
   */
  afterInit() {
    this.logger.debug("GameupdateCenter correctly initialized");
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
      client.disconnect();
    }

    // if token is ok then store the UserEntity for quick acces
    this.socketID_UserEntity.set(client.id, user_entity);
    let nbr_of_socket = this.login_to_nbr_of_active_socket.get(user_entity.login);

    // check if undefined is it is then set the value to 0 instead
    nbr_of_socket = nbr_of_socket ?? 0;
    this.login_to_nbr_of_active_socket.set(user_entity.login, ++nbr_of_socket);
    this.transfer_all_match(client);
    console.log("in handle connection nbr_of socket vaut : ", nbr_of_socket);
    this.logger.debug("client Connected---------------- socket id : " + client.id + " client login" + user_entity.login);
  }

  transfer_all_match(@ConnectedSocket() client: Socket) {
    console.log("in transfert there is : ", this.all_the_match.length);
    for (let index = 0; index < this.all_the_match.length; index++) {
      const match = this.all_the_match[index];
      this.server.to(client.id).emit("Match_Update", match);
    }
  }

  second_loop() {
    let i = 0;
    while (true) {
      i++;
      if (i === 1000000000) {
        console.log("out of second loop");
        break;
      }
    }
  }

  @SubscribeMessage("Test")
  test_function() {
    let i = 0;
    while (true) {
      i++;
      if (i === 1000000000) {
        console.log("out of first loop");
        break;
      }
    }
    this.second_loop();
  }

  /**
   * start a game instance for the player 1 and 2 to play together
   * @param player1 the Socket from socket.io of player1
   * @param player2 the Socket from socket.io of player2
   * @param super_game_mode the boolean representing the super_game_mode version of the game
   */
  StartGameRoom(@ConnectedSocket() player1: Socket, @ConnectedSocket() player2: Socket, super_game_mode: boolean) {
    console.log("entering StartGameRoom function", player1.id);
    // make the player join the room of name player1.socket.id
    player1.join(player1.id);
    player2.join(player1.id);
    let player1_login = this.socketID_UserEntity.get(player1.id).login;
    let player2_login = this.socketID_UserEntity.get(player2.id).login;

    // Start ---------- set a game instance for the player and add it to the game instance [] ----------
  
    // creating the game instance with the correct gameEngine and service for storing goal
    let p = new Game_Instance();
    if (super_game_mode === true) { p.game_engine = new GameEngineService(this.userservice, this.matchservice); }
    else { p.game_engine = new PongEngineService(this.userservice, this.matchservice); }
  
    // setting the player and UserEntity of player for the gameEngine
    let match: MatchState = {player1_login: player1_login, player2_login: player2_login, player1_score: 0, player2_score: 0, super_game_mode: super_game_mode, game_has_started: false};
    this.all_the_match.push(match);
    p.players = [];
    p.spectators = [];
    p.game_has_ended = false;
    p.players.push(player1);
    p.players.push(player2);
    // console.log("the game instance added to the game instance : ", p);
    this.game_instance.push(p);
    p.game_engine.set_player(player1, player2, this.socketID_UserEntity.get(player1.id), this.socketID_UserEntity.get(player2.id), this.server, this.waiting_on_match, this.all_the_match, p);
    // End ---------- set a game instance for the player and add it to the game instance [] ----------


    // emit the Player struct to the front to display the player login
    let players = new Login_Sharing();
    // test vector move
    // console.log("test in p", p.game_has_ended);
    // console.log("test in instance[]", this.game_instance[this.game_instance.length - 1].game_has_ended);
    // p.game_has_ended = true;
    // console.log("test in p after change", p.game_has_ended);
    // console.log("test in instance[] after change", this.game_instance[this.game_instance.length - 1].game_has_ended);
    players.player1_login = player1_login;
    players.player2_login = player2_login;
    this.server.to(player1.id).emit('Players', players);
    console.log("JUST EMITED PLAYERS EVENT -------------------------------------------------------------------------------------");
    this.logger.debug("a game room has been created");
    console.log("leaving StartGameRoom function");
  }

  clean_match() {
    for (let index = this.game_instance.length -1; index >= 0; index--) {
      const element = this.game_instance[index];
      if (element.game_has_ended) {
        console.log("game of : ", element.players[0], "and : ", element.players[1], "are trashed");
        for (let spec = 0; spec < element.spectators.length; spec++) {
          const spectateur = element.spectators[spec];
          spectateur.leave(element.players[0].id);
        }
        element.players[1].leave(element.players[0].id);
        this.game_instance.splice(index, 1);
      }
    }
  }

  /**
   * match two player according to the game type they want to play
   * @param client the client Socket
   * @param body a PublicGameRequestDTO containing the game type that the user want to play
   * @returns nothing
   */
  @SubscribeMessage("Public_Matchmaking")
  handlePublicMatchmaking(@ConnectedSocket() client: Socket, @MessageBody() body: PublicGameRequestDTO) {
    
    console.log("JUST RECEIVED PUBLIC REQUEST EVENT -------------------------------------------------------------------------------------");
    // check if client is already in a waiting queu or game
    this.clean_match();
    console.log("waiting on game set containe before : ", this.waiting_on_match);
    if (this.waiting_on_match.has(this.socketID_UserEntity.get(client.id).login)) {
      console.log("check is waiting true");
      this.server.to(client.id).emit("Already_On_Match");
      console.log("waiting on game set containe in already waiting : ", this.waiting_on_match);
      return;
    }
    // check if there is already a waiting socket for a potential matchmaking
    for (let index = 0; index < this.public_space.length; index++) {
      const element = this.public_space[index];
      console.log("entering handlePublicMatchmaking function");

      // if a waiting socket with the same game_mode is already waiting
      if (element.super_game_mode === body.super_game_mode) {
        this.logger.debug("client : ", element.waiting_client_socket.id, "and client : ", client.id, "have been match together in a game instance with super_game_mode : ", body.super_game_mode);

        // create a game instance for them
        this.StartGameRoom(element.waiting_client_socket, client, body.super_game_mode)
        // remove the waiting socket from the queu
        this.public_space.splice(index, 1);
        this.logger.debug("game room created");
        console.log("waiting on game set containe after match created: ", this.waiting_on_match);
        return;
      }
    }

    // if no socket where waiting or no match of mode where found add the socket to the waiting socket list
    let ws: Waiting_Socket = new Waiting_Socket();
    ws.super_game_mode = body.super_game_mode;
    ws.waiting_client_socket = client;
    ws.target_client_login = "";
    this.waiting_on_match.add(this.socketID_UserEntity.get(client.id).login);
    // console.log("the waiting socket to be added", ws);
    this.public_space.push(ws);
    console.log("waiting on game set containe just before leaving the function : ", this.waiting_on_match);
    console.log("leaving handlePublicMatchmaking function");
  }

  @SubscribeMessage("Game_Update")
  test(@ConnectedSocket() test: Socket, @MessageBody() body: any) {
    console.log("test", body);
  }

  @SubscribeMessage("Spectator_Request")
  handleSpectatorRequest(@ConnectedSocket() client: Socket, @MessageBody() body: SpectatorRequestDTO) {
    for (let index = 0; index < this.game_instance.length; index++) {
      const game = this.game_instance[index];
      if (this.socketID_UserEntity.get(game.players[0].id).login === body.player1_login) {
        game.spectators.push(client);
        client.join(game.players[0].id);
      }
    }
  }

  /**
   * find in witch game instance the client is a player and toggle his ready state
   * @param client the Socket from Socket.io
   */
 @SubscribeMessage("Ready")
  handleReady(@ConnectedSocket() client: Socket) { // TODO check on the engine side what happen if the player send a ready message in a ongoing match
    console.log("JUST RECEIVED READY EVENT -------------------------------------------------------------------------------------");

    console.log("entering handleReady function");
    for (let i = 0; i < this.game_instance.length; i++) {
      const game = this.game_instance[i];
      for (let j = 0; j < game.players.length; j++) {
        const player = game.players[j];
        if (player === client) {
          game.game_engine.set_player_ready(player);
          console.log("leaving handleReady function");
          return;
        }
      }
    }
    console.log("leaving handleReady function");
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
          this.server.to(game.players[0].id).emit('Spectator_Disconnection');
          game.spectators.splice(j, 1);
          console.log("leaving find_and_remove function finding a spectator to be removed");
          return;
        }
      }

      // if the client is a player
      for (let j = 0; j < game.players.length; j++) {
        const player = game.players[j];
        if (player === client) {
          this.server.to(game.players[0].id).emit('Player_Disconnection', this.socketID_UserEntity.get(player.id).login);
          game.game_engine.stop_game(client);
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
  
  get_socket_by_login(table: Map<string, UserEntity>, login: string) {
    for (let [key, value] of table.entries()) {
      if (value.login === login){
        return key;
      }
    }
  }

  /**
   * handle private invitation
   * @param body a PrivateGameRequestDTO containing a non empty target string and a super_game_mode boolean
   * @param client the client posting the request
   * @returns nothing
   */
  @SubscribeMessage("Private_Matchmaking")
  handlePrivateMatchmaking(@MessageBody() body: PrivateGameRequestDTO, @ConnectedSocket() client: Socket) {
    console.log("entering handlePrivateMatching function");
    
    this.clean_match();
    // check if client is already in a waiting queu or game
    if (this.waiting_on_match.has(this.socketID_UserEntity.get(client.id).login)) {
      this.server.to(client.id).emit("Already_On_Match");
      return;
    }

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
    this.waiting_on_match.add(this.socketID_UserEntity.get(client.id).login);
    //this.logger.debug("resulting in this object: super_game_mode: ", private_room.super_game_mode, "\n waiting socket", private_room.waiting_client_socket.id, "\n target : ", private_room.target_client_login);
    this.private_space.push(private_room);
    if (this.waiting_on_match.has(body.target))
    {
      this.server.to(this.get_socket_by_login(this.socketID_UserEntity, private_room.target_client_login)).emit("Invitation", {for: body.target, by: this.socketID_UserEntity.get(client.id).login, send: false});
    }
    else {
      this.server.to(this.get_socket_by_login(this.socketID_UserEntity, private_room.target_client_login)).emit("Invitation", {for: body.target, by: this.socketID_UserEntity.get(client.id).login, send: true});
    }

    console.log("leaving handlePrivateMatching function");
  }

  /**
   * process the input if the client is a player
   * @param body the input of the client containg one non empty string
   * @param client the client
  */
  @SubscribeMessage("Game_Input")
  OnGame_Input(@MessageBody() body: GameInputDTO, @ConnectedSocket() client: Socket) {
    // if the client is in game
    for (let i = 0; i < this.game_instance.length; i++) {
      const game = this.game_instance[i];
      for (let j = 0; j < game.players.length; j++) {
        const player = game.players[j];
        if (player === client) {
          //this.logger.debug("client.id : ", client.id, "inputed", body.input);
          game.game_engine.process_input(client, body);
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
   * find and remove the disconnected client from relevante struc,
   * stop the current match if necessary, and remove the client from known socket
   * @param client the client disconnected
   */
  handleDisconnect(@ConnectedSocket() client: Socket) { // log client disconnection
    this.logger.log('------------------------------client Disconnected: ' + client.id + "---------------------------");
    this.find_and_remove(client);
    let user_login = this.socketID_UserEntity.get(client.id).login;
    let nbr_of_socket = this.login_to_nbr_of_active_socket.get(user_login);
    console.log("client id : " + client.id + "witch is login : " + user_login + "has : ", this.login_to_nbr_of_active_socket.get(user_login));
    if (nbr_of_socket <= 1) {
      this.waiting_on_match.delete(this.socketID_UserEntity.get(client.id).login);
      this.logger.debug("client was removed from waiting on game due to disconnection");
    }
    else {
      console.log("LOGICAL ERROR, should never be display, unless we try to remove a user.id from the waiting[]/ongoing match socket[] where he was not");
    }
    this.login_to_nbr_of_active_socket.set(user_login, --nbr_of_socket)
    if (this.socketID_UserEntity.delete(client.id) === false) {
      this.logger.debug("Critical logic error, trying to removed a client that doesn't exist, should never display");
    }
  }

}