/**
 * this file contain all of the game socket logistic and event handling like disconnection and input
 */

import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'; // socket event handling stuff
import { GameInputDTO, matchHistoryDto, PrivateGameRequestDTO, PublicGameRequestDTO, SpectatorRequestDTO } from './game_update_center.dto'; // all the DTO (struct use to verified field of incoming request)
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
  waiter_login: string;
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
   if (user_entity === null) {
     console.log("user_entity : ", user_entity, "has no valide token and so was kicked");
     client.disconnect();
     return;
    }
    
    // if token is ok then store the UserEntity for quick acces
    this.socketID_UserEntity.set(client.id, user_entity);
    let nbr_of_socket = this.login_to_nbr_of_active_socket.get(user_entity.login);
    
    // check if undefined is it is then set the value to 0 instead
    nbr_of_socket = nbr_of_socket ?? 0;
    this.login_to_nbr_of_active_socket.set(user_entity.login, ++nbr_of_socket);
    
    //this.transfer_all_match(client);
    console.log("in handle connection nbr_of socket vaut : ", nbr_of_socket);
    this.logger.debug("client Connected---------------- socket id : " + client.id + " client login" + user_entity.login);
    this.server.to(client.id).emit("Connection_Accepted");
  }
  
  @SubscribeMessage("Ask_Invitation") // lors d'un refresh de page pour reafficher la popup
  handle_resend_invite(@ConnectedSocket() client: Socket, @MessageBody() body: SpectatorRequestDTO) {
    console.log("IN ASK INVITATION : received Ask_Invitation message of : " + client.id);
    this.clean_old_socket();
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("error with login null");
      return;
    }
    for (let index = 0; index < this.private_space.length; index++) {
      const element = this.private_space[index];
      if (element.target_client_login === user.login) {
        this.logger.debug("sending Invitation to a target soket", {for: element.target_client_login, by: element.waiter_login, send: true, super_game_mode: element.super_game_mode});
        this.server.to(client.id).emit("Invitation", {for: element.target_client_login, by: element.waiter_login, send: true, super_game_mode: element.super_game_mode});
        continue;
      }
      else if (element.waiter_login === user.login) {
        this.logger.debug("sending Invitation to a waiter socket", {for: element.target_client_login, by: element.waiter_login, send: true, super_game_mode: element.super_game_mode});
        this.server.to(client.id).emit("Invitation", {for: element.target_client_login, by: element.waiter_login, send: true, super_game_mode: element.super_game_mode});
      }
    }
    console.log("end of ASK INVITATION");
  }

  @SubscribeMessage("Get_Matches") // resend all ongoing match to a client
  givematches(@ConnectedSocket() client: Socket) {
    console.log("received a Get_Matches event");
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("user is not yet recognize");
      return;
    }
    this.transfer_all_match(client);
  }

  @SubscribeMessage("Get_Status") // lorsqu'on revient ou arrive sur la page game pour afficher le bon truc
  handleStatus(@ConnectedSocket() client: Socket) {
    console.log("entering get_status function as : ", client.id);
    this.clean_old_socket();
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("user is not yet recognize");
      return;
    }
    for (let index1 = 0; index1 < this.game_instance.length; index1++) {
      const game = this.game_instance[index1];
      for (let index2 = 0; index2 < game.spectators.length; index2++) {
        const spec = game.spectators[index2];
        if (spec === client) {
          this.logger.debug("leaving get_status sending : spectator");
          this.server.to(client.id).emit("spectator");
          return;
        }
      }
    }
    if (!this.waiting_on_match.has(user.login)) {
      this.logger.debug("leaving get_status sending : nothing");
      this.server.to(client.id).emit("nothing");
      return;
    }
    for (let index = 0; index < this.public_space.length; index++) {
      const element = this.public_space[index];
      if (element.waiting_client_socket === client) {
        this.logger.debug("leaving get_status sending : in matchmaking");
        this.server.to(client.id).emit("in matchmaking", user.login);
        return;
      }
    }
    for (let index = 0; index < this.game_instance.length; index++) {
      const element = this.game_instance[index];
      if (element.players[0] === client || element.players[1] === client) {
        let player = element.players[0] === client ? 0 : 1;
        if (element.game_engine.pl1_ready && element.game_engine.pl2_ready) {
          this.server.to(client.id).emit("ongoing match", user.login);
          this.logger.debug("leaving get_status sending : ongoing match");
          return;
        }
        if ((player === 0 && element.game_engine.pl1_ready) || (player === 1 && element.game_engine.pl2_ready)) {
          this.server.to(client.id).emit("ready in match", user.login);
          this.logger.debug("leaving get_status sending : ready in math");
          return;
        }
        this.server.to(client.id).emit("in match", user.login);
        this.logger.debug("leaving get_status sending : in match");
        return;
      }
    }
    this.logger.debug("leaving get_status without sending anything ");
  }

  /**
   * start a game instance for the player 1 and 2 to play together
   * @param player1 the Socket from socket.io of player1
   * @param player2 the Socket from socket.io of player2
   * @param super_game_mode the boolean representing the super_game_mode version of the game
   */
  StartGameRoom(@ConnectedSocket() player1: Socket, @ConnectedSocket() player2: Socket, super_game_mode: boolean) {
    console.log("entering StartGameRoom function player1 : ", player1.id);
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
    console.log("adding a null match in match");
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
    console.log("JUST EMITED PLAYERS EVENT ---------------\n a game room has been created leaving StartGameRoom function");
  }

  clean_match() { // utility function to call all the time to clean match that need to be clean of game instance
    for (let index = this.game_instance.length -1; index >= 0; index--) {
      const element = this.game_instance[index];
      if (element.game_has_ended) {
        this.logger.debug("game of : ", element.players[0], "and : ", element.players[1], "are trashed");
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
    
    console.log("JUST RECEIVED PUBLIC REQUEST EVENT -------------------------");
    // check if client is already in a waiting queu or game
    this.clean_match();
    this.clean_old_socket();
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("to fast publick matchmaking request");
      return;
    }
    this.remove_if_invited(user.login);
    console.log("waiting on game set containe before : ", this.waiting_on_match);
    if (this.waiting_on_match.has(user.login)) {
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
        this.find_and_remove_spect(client);
        this.find_and_remove_spect(element.waiting_client_socket);
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
    ws.waiter_login = user.login;
    ws.target_client_login = "";
    this.waiting_on_match.add(user.login);
    // console.log("the waiting socket to be added", ws);
    this.public_space.push(ws);
    console.log("waiting on game set containe just before leaving the function : ", this.waiting_on_match);
    console.log("leaving handlePublicMatchmaking function");
  }

  @SubscribeMessage("Spectator_Request")
  handleSpectatorRequest(@ConnectedSocket() client: Socket, @MessageBody() body: SpectatorRequestDTO) {
    this.clean_old_socket();
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("user is not yet recognize");
      return;
    }
    for (let index = 0; index < this.game_instance.length; index++) {
      const game = this.game_instance[index];
      if (this.socketID_UserEntity.get(game.players[0].id).login === body.player1_login) {
        for (let index = 0; index < game.spectators.length; index++) {
          const spec = game.spectators[index];
          if (spec.id === client.id) {
            return;
          }
        }
        game.spectators.push(client);
        console.log("join in spec mod the same game");
        client.join(game.players[0].id);
        game.game_engine.update_match_state();
      }
    }
  }

  /**
   * find in witch game instance the client is a player and toggle his ready state
   * @param client the Socket from Socket.io
  */
  @SubscribeMessage("Ready")
  handleReady(@ConnectedSocket() client: Socket) {
    console.log("JUST RECEIVED READY EVENT ------------- entering handleReady function");
    this.clean_old_socket();
    this.clean_match();
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("user is not yet recognize");
      return;
    }

    for (let i = 0; i < this.game_instance.length; i++) {
      const game = this.game_instance[i];
      for (let j = 0; j < game.players.length; j++) {
        const player = game.players[j];
        if (player === client) {
          game.game_engine.set_player_ready(player);
          console.log("leaving handleReady function having call set_player ready in game engin");
          return;
        }
      }
    }
    console.log("leaving handleReady function whitout doing anything");
  }

  get_all_socket_of_user(login: string): string[] {
    let result: string[] = [];
    for (let [key, value] of this.socketID_UserEntity.entries()) {
      if (value.login === login){
        result.push(key);
      }
    }
    return result;
  }
  
  find_and_remove_private(@ConnectedSocket() client: Socket) {
    console.log("entering find_and_remove_private function");
    
    this.clean_old_socket();
    this.clean_match();
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("avoid a crash");
      return;
    }
    // if the client was waiting for a private match or is the target of a match
    for (let i = 0; i < this.private_space.length; i++) {
      const ws = this.private_space[i];
      if (ws.waiting_client_socket === client) {
        let all_socket: string[] = this.get_all_socket_of_user(ws.target_client_login);
        for (let index = 0; index < all_socket.length; index++) {
          const element = all_socket[index];
          console.log("sending in find and remove invitation send false to all target socket if the client disconnecting is the waiter");
          this.server.to(element).emit("Invitation", {for: ws.target_client_login, by: ws.waiter_login, send: false, super_game_mode: ws.super_game_mode})
        }
        this.waiting_on_match.delete(ws.target_client_login);
        this.private_space.splice(i, 1);
        console.log("leaving find_and_remove function having find a waiting socket in private_space");
        return;
      }
      if (ws.target_client_login === user.login) {
        let all_socket: string[] = this.get_all_socket_of_user(ws.waiter_login);
        for (let index = 0; index < all_socket.length; index++) {
          const element = all_socket[index];
          console.log("sending in find and remove invitation send false to all waiter socket if socket disconnecting is the last socket of the target");
          this.server.to(element).emit("Invitation", {for: ws.target_client_login, by: ws.waiter_login, send: false, super_game_mode: ws.super_game_mode})
        }
        this.waiting_on_match.delete(ws.waiter_login)
        this.private_space.splice(i, 1);
        console.log("leaving find_and_remove function having find a waiting socket in private_space");
        return;
      }
    }
  }
  
  /**
   * find and remove the client from the correct struct, stopping the game if needed
   * @param client the client who got disconnected
   * @returns 
  */
  find_and_remove(@ConnectedSocket() client: Socket) {
    console.log("entering find_and_remove function");
   
    this.clean_old_socket();
    this.clean_match();
    // check if the client is in a ongoing game
    for (let i = 0; i < this.game_instance.length; i++) {
      const game = this.game_instance[i];

      // if the client is a spectator
      for (let j = 0; j < game.spectators.length; j++) { // TODO update the room if nessessary
        const spec = game.spectators[j];
        if (client === spec) {
          this.server.to(game.players[0].id).emit('Spectator_Disconnection');
          client.leave(game.players[0].id);
          game.spectators.splice(j, 1);
          this.socketID_UserEntity.delete(client.id)
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
          this.socketID_UserEntity.delete(client.id)
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
        this.waiting_on_match.delete(this.socketID_UserEntity.get(client.id).login)
        if (this.socketID_UserEntity.delete(client.id) === false) {
          this.logger.debug("Critical logic error, trying to removed a client that doesn't exist, should never display");
        }
        console.log("leaving find_and_remove function having find a waiting socket in public_space");
        return;
      }
    }
    
    console.log("leaving find_and_remove function");
  }

  @SubscribeMessage("Quit_Match")
  handle_quitting_match(@ConnectedSocket() client: Socket) {
    console.log("received quit_match");
    this.clean_old_socket();
    this.clean_match();
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("user is not yet recognize");
      return;
    }
    for (let index1 = 0; index1 < this.public_space.length; index1++) {
      const public_space = this.public_space[index1];
      if (public_space.waiting_client_socket.id === client.id) {
        this.public_space.splice(index1, 1);
        this.waiting_on_match.delete(user.login)
        console.log("leaving quit_match removing user : " + client.id + "from public space");
        return;
      }
    }
  }

  @SubscribeMessage("Quit_Spectator")
  handle_spectator_quitting(@ConnectedSocket() client: Socket) {
    this.clean_old_socket();
    this.clean_match();
    this.find_and_remove_spect(client);
  }

  find_and_remove_spect(@ConnectedSocket() client: Socket) {
    this.logger.debug("entering remove spectator");
    this.clean_old_socket();
    this.clean_match();
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("not ready yet to remove spec");
      return;
    }
    for (let index1 = 0; index1 < this.game_instance.length; index1++) {
      const game = this.game_instance[index1];
      for (let index2 = 0; index2 < game.spectators.length; index2++) {
        const spec = game.spectators[index2];
        if (spec === client) {
          this.server.to(game.players[0].id).emit('--------------Spectator_Disconnection');
          spec.leave(game.players[0].id);
          game.spectators.splice(index2, 1);
          console.log("leaving find_and_remove function finding a spectator to be removed");
          return;
        }
      }
    }
    console.log("leaving find_and_remove function NOT finding a spectator to be removed");
  }
  
  get_socketid_by_login(table: Map<string, UserEntity>, login: string) : string {
    for (let [key, value] of table.entries()) {
      if (value.login === login){
        return key;
      }
    }
    return null;
  }
  
  @SubscribeMessage("Cancel_Invitation") // losrqu'on a fait une invitation et qu'on veut la cancel, une seul invitation par login est possible
  handle_canceled(@ConnectedSocket() client: Socket) {
    console.log("entering cancel invitation by : ", client.id);
    this.clean_old_socket();
    this.clean_match();
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("user is not yet recognize");
      return;
    }
    for (let index1 = 0; index1 < this.private_space.length; index1++) {
      let all_waiter_socket: string[] = this.get_all_socket_of_user(user.login);
      const element = this.private_space[index1];
      for (let index2 = 0; index2 < all_waiter_socket.length; index2++) {
        const waiter = all_waiter_socket[index2];
        if (waiter === element.waiting_client_socket.id) {
          this.logger.debug("found a invitation to be canceled");
          let all_target_socket: string[] = this.get_all_socket_of_user(element.target_client_login);
          for (let index3 = 0; index3 < all_target_socket.length; index3++) {
            const element2 = all_target_socket[index3];
            this.logger.debug("emitting clear invite for a target socket : " + element2);
            this.server.to(element2).emit("Clear_Invite", {for: element.target_client_login, by: user.login, send: true, super_game_mode: element.super_game_mode});
          }
          for (let index4 = 0; index4 < all_waiter_socket.length; index4++) {
            const element2 = all_waiter_socket[index4];
            if (element2 != client.id) {
              console.log("emiting clear_invite to a waiter socket : " + element2);
              this.server.to(element2).emit("Clear_Invite", {for: element.target_client_login, by: user.login, send: true, super_game_mode: element.super_game_mode});
            }
          }
          this.waiting_on_match.delete(user.login);
          this.waiting_on_match.delete(element.target_client_login);
          this.private_space.splice(index1, 1);
          return;
        }
      }
    }
  }

  remove_from_all_invite(login: string) {
    console.log("entering remove from all invite : should not be usefull anymore");
    this.clean_old_socket();
    this.clean_match();
    for (let index1 = this.private_space.length - 1; index1 >= 0; index1--) {
      const private_room = this.private_space[index1];
      if (private_room.waiter_login === login || private_room.target_client_login === login) {
        this.logger.debug("found a room where :" + login + "is a waiter or target");
        let all_waiter_socket: string[] = this.get_all_socket_of_user(private_room.waiter_login);
        let all_target_socket: string[] = this.get_all_socket_of_user(private_room.target_client_login);
        for (let index2 = 0; index2 < all_target_socket.length; index2++) {
          const target = all_target_socket[index2];
          this.logger.debug("emiting clear invite to a target socket : " + target);
          this.server.to(target).emit("Clear_Invite", {for: private_room.target_client_login, by: private_room.waiter_login, send: true, super_game_mode: private_room.super_game_mode})
        }
        for (let index3 = 0; index3 < all_waiter_socket.length; index3++) {
          const waiter = all_waiter_socket[index3];
          this.server.to(waiter).emit("Clear_Invite", {for: private_room.target_client_login, by: private_room.waiter_login, send: true, super_game_mode: private_room.super_game_mode})
        }
        this.private_space.splice(index1, 1);
      }
    }
  }

  @SubscribeMessage("Accept_Invite")
  handle_accept_invite(@ConnectedSocket() client: Socket) {
    console.log("entering accept invite function");
    this.clean_match();
    this.clean_old_socket();
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("to fast private matchmaking request");
      return;
    }
    // check the existing waiting socket to find a potential match
    for (let i = 0; i < this.private_space.length; i++) {
      const private_room = this.private_space[i];
      // if match and target not occupied
      if (private_room.target_client_login === user.login) {
        this.logger.debug("private matchmaking found to be accepeted");
        console.log("sending invitation accepted to the waiter socket");
        this.server.to(private_room.waiting_client_socket.id).emit("Invitation_Accepted");
        this.server.to(client.id).emit("Invitation_Accepted");
        let all_waiter_socket: string[] = this.get_all_socket_of_user(private_room.waiter_login);
        for (let index2 = 0; index2 < all_waiter_socket.length; index2++) {
          const waiter2 = all_waiter_socket[index2];
          if (waiter2 != private_room.waiting_client_socket.id) {
            console.log("sending clear_invite to a waiter socket that is not the original : " + waiter2);
            this.server.to(waiter2).emit("Clear_Invite", {for: private_room.target_client_login, by: private_room.waiter_login, send: true, super_game_mode: private_room.super_game_mode});
          }
        }
        let all_target_socket: string[] = this.get_all_socket_of_user(private_room.target_client_login);
        for (let index3 = 0; index3 < all_target_socket.length; index3++) {
          const accepter = all_target_socket[index3];
          if (accepter != client.id) {
            console.log("sending clear_invite to a target socket");
            this.server.to(accepter).emit("Clear_Invite", {for: private_room.target_client_login, by: private_room.waiter_login, send: true, super_game_mode: private_room.super_game_mode});
          }
        }
        this.find_and_remove_spect(client);
        this.find_and_remove_spect(private_room.waiting_client_socket);
        this.StartGameRoom(private_room.waiting_client_socket, client, private_room.super_game_mode);
        //this.remove_from_all_invite(private_room.target_client_login);
        this.private_space.splice(i, 1);
        console.log("leaving handlePrivateMatching function afte a match started");
        return;
      }
    }
    this.logger.debug("leaving accept invitation without finding invite");
  }
      
  /**
   * handle private invitation
   * @param body a PrivateGameRequestDTO containing a non empty target string and a super_game_mode boolean
   * @param client the client posting the request
   * @returns nothing
   */
  @SubscribeMessage("Private_Matchmaking") // post et acceptation d'une invitation
  async handlePrivateMatchmaking(@MessageBody() body: PrivateGameRequestDTO, @ConnectedSocket() client: Socket) {
    console.log("entering handlePrivateMatching function");
    
    this.clean_match();
    this.clean_old_socket();
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("to fast private matchmaking request");
      return;
    }
    // exit the function if the client is already occupied
    this.remove_if_invited(user.login);
    if (this.waiting_on_match.has(user.login)) {
      this.logger.debug("client is already in waiting on match : " + client.id);
      this.server.to(client.id).emit("You_Are_Occupied");
      return;
    }
    
    // check if the target is connected and not occupied
    if (!(this.get_socketid_by_login(this.socketID_UserEntity, body.target) && !this.waiting_on_match.has(body.target)))
    {
      this.logger.debug("sending to : " + client.id + "invitation false because target is either occupied or not connected");
      this.server.to(client.id).emit("Invitation", {for: body.target, by: user.login, send: false, super_game_mode: body.super_game_mode})
      return;
    }
    
    let all_blocked_by = await this.userservice.getBlockedMeList(user.id)
    for (let index = 0; index < all_blocked_by.length; index++) {
      const one_user = all_blocked_by[index];
      if (one_user.name === body.target) {
        console.log("invitation not posted because of blocked by target");
        this.server.to(client.id).emit("Invitation", {for: body.target, by: user.login, send: false, super_game_mode: body.super_game_mode})
        return;
      }
    }

    // if no match where found add the private game request to the queu
    this.logger.debug("no match where found, socket is now waiting for target to accept invit in a super_game_mode : ", body.super_game_mode);
    let private_room = new Waiting_Socket();
    private_room.waiting_client_socket = client;
    private_room.waiter_login = user.login;
    private_room.target_client_login = body.target;
    private_room.super_game_mode = body.super_game_mode;
    this.waiting_on_match.add(user.login);
    this.waiting_on_match.add(body.target);
    //this.logger.debug("resulting in this object: super_game_mode: ", private_room.super_game_mode, "\n waiting socket", private_room.waiting_client_socket.id, "\n target : ", private_room.target_client_login);
    this.private_space.push(private_room);
    let all_waiter_socket: string[] = this.get_all_socket_of_user(user.login);
    for (let index = 0; index < all_waiter_socket.length; index++) {
      const waiter = all_waiter_socket[index];
      console.log("posting invite: sending to a waiter socket");
      this.server.to(waiter).emit("Invitation", {for: body.target, by: user.login, send: true, super_game_mode: body.super_game_mode})
    }
    let all_target_socket: string[] = this.get_all_socket_of_user(private_room.target_client_login);
    for (let index = 0; index < all_target_socket.length; index++) {
      const target = all_target_socket[index];
      console.log("posting invite: sending to a receiver socket");
      this.server.to(target).emit("Invitation", {for: body.target, by: user.login, send: true, super_game_mode: body.super_game_mode});
    }
    console.log("leaving handlePrivateMatching function after posting an invite");
  }
  
  remove_if_invited(login: string) {
    this.clean_old_socket();
    this.clean_match();
    console.log("in remove from invitation");
    for (let index1 = 0; index1 < this.private_space.length; index1++) {
      const private_room = this.private_space[index1];
      if (private_room.target_client_login === login) {
        this.logger.debug("found a invitation the client where in");
        let all_waiter_socket: string[] = this.get_all_socket_of_user(private_room.waiter_login);
        let all_target_socket: string[] = this.get_all_socket_of_user(private_room.target_client_login);
        for (let index3 = 0; index3 < all_target_socket.length; index3++) {
          const target = all_target_socket[index3];
          console.log("sending Clear_Invite");
          this.server.to(target).emit("Clear_Invite", {for: private_room.target_client_login, by: private_room.waiter_login, send: true, super_game_mode: private_room.super_game_mode})
        }
        for (let index2 = 0; index2 < all_waiter_socket.length; index2++) {
          const waiter = all_waiter_socket[index2];
          this.server.to(waiter).emit("Invite_Declined", {for: private_room.target_client_login, by: private_room.waiter_login, send: true, super_game_mode: private_room.super_game_mode})
        }
        this.waiting_on_match.delete(private_room.waiter_login);
        this.waiting_on_match.delete(private_room.target_client_login);
        this.private_space.splice(index1, 1);
        return;
      }
    }
  }

  @SubscribeMessage("Decline_Invitation") // lorsqu'on refuse l'invitation
  handle_denied(@ConnectedSocket() client: Socket, @MessageBody() body: SpectatorRequestDTO ) {
    console.log("Entering decline invitation by socket id : " + client.id);
    this.clean_old_socket();
    this.clean_match();
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("user is not yet recognize");
      return;
    }
    for (let index1 = 0; index1 < this.private_space.length; index1++) {
      const private_room = this.private_space[index1];
      if (private_room.target_client_login === user.login) {
        this.logger.debug("found an invitation that : " + user.login + "is a target on and wish to declined");
        let all_waiter_socket: string[] = this.get_all_socket_of_user(private_room.waiter_login);
        let all_target_socket: string[] = this.get_all_socket_of_user(private_room.target_client_login);
        for (let index2 = 0; index2 < all_waiter_socket.length; index2++) {
          const waiter = all_waiter_socket[index2];
          this.server.to(waiter).emit("Invite_Declined", {for: private_room.target_client_login, by: private_room.waiter_login, send: true, super_game_mode: private_room.super_game_mode});
        }
        for (let index3 = 0; index3 < all_target_socket.length; index3++) {
          const target = all_target_socket[index3];
          if (target != client.id) {
            this.logger.debug("emiting clear invite to a target socket : " + target);
            this.server.to(target).emit("Clear_Invite", {for: private_room.target_client_login, by: private_room.waiter_login, send: true, super_game_mode: private_room.super_game_mode})
          }
        }
        this.waiting_on_match.delete(private_room.waiter_login);
        this.waiting_on_match.delete(private_room.target_client_login);
        this.private_space.splice(index1, 1);
        return;
      }
    }
    this.logger.debug("leaving decline invite without finfing anything");
  }

  /**
   * process the input if the client is a player
   * @param body the input of the client containg one non empty string
   * @param client the client
  */
  @SubscribeMessage("Game_Input")
  OnGame_Input(@MessageBody() body: GameInputDTO, @ConnectedSocket() client: Socket) {
    let user = this.socketID_UserEntity.get(client.id);
    if (!user) {
      this.logger.debug("user is not yet recognize");
      return;
    }
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

  @SubscribeMessage("matchHistory")
  handleMatchHistory(@MessageBody() data: matchHistoryDto, @ConnectedSocket() client: Socket) {
    this.tokenChecker(client)
    .then((user) => {
      this.matchservice.findMatch()
      .then(pouet => {
        // console.log("matchos: ", pouet);
      })
      if (user) {
        this.matchservice.matchHistory(data.userId)
        .then((matches) => {
          // console.log("tableau : ", matches);
          client.emit("matchHistory", matches);
        })
      }
    })
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
  
  clean_old_socket() {
    console.log("entering clean old socket");
    for (let index1 = this.private_space.length - 1; index1 >= 0; index1--) {
      const private_space = this.private_space[index1];
      let already_seen = false;
      for (let [key, value] of this.socketID_UserEntity.entries()) {
        if (key === private_space.waiting_client_socket.id){
          already_seen = true;
          break;
        }
      }
      if (!already_seen) {
        console.log("found an old socket : " + private_space.waiting_client_socket.id, "of : " + private_space.waiter_login);
        this.waiting_on_match.delete(private_space.waiter_login);
        this.private_space.splice(index1, 1);
      }
    }
    console.log("first forllop past");
    for (let index1 = this.public_space.length - 1; index1 >= 0; index1--) {
      const public_space = this.public_space[index1];
      let already_seen = false;
      for (let [key, value] of this.socketID_UserEntity.entries()) {
        if (key === public_space.waiting_client_socket.id){
          already_seen = true;
          break;
        }
      }
      if (!already_seen) {
        console.log("found an old socket in public space : " + public_space.waiting_client_socket.id, "of : " + public_space.waiter_login);
        this.waiting_on_match.delete(public_space.waiter_login);
        this.public_space.splice(index1, 1);
      }
    }
    console.log("end of function");
  }

  /**
   * find and remove the disconnected client from relevante struc,
   * stop the current match if necessary, and remove the client from known socket
   * @param client the client disconnected
   */
  handleDisconnect(@ConnectedSocket() client: Socket) { // log client disconnection
    let user = this.tokenChecker(client)
    .then((user) => {
      if (!user)
        return;
      console.log('------------------------------client Disconnected: ' + client.id + "---------------------------");
      let users = this.socketID_UserEntity.get(client.id);
      if (!users) {
        this.logger.debug("disconnection to fast ?");
        return;
      }
      this.find_and_remove(client);
      let nbr_of_socket = this.login_to_nbr_of_active_socket.get(users.login);
      console.log("client id : " + client.id + "witch is login : " + users.login + "has : ", this.login_to_nbr_of_active_socket.get(users.login));
      if (nbr_of_socket <= 1) {
        this.find_and_remove_private(client);
        this.waiting_on_match.delete(users.login);
        this.logger.debug("client was removed from waiting on game due to disconnection");
      }
      // else {
      //   // console.log("LOGICAL ERROR, should never be display, unless we try to remove a user.id from the waiting[]/ongoing match socket[] where he was not");
      // }
      this.login_to_nbr_of_active_socket.set(users.login, --nbr_of_socket)
      this.socketID_UserEntity.delete(client.id)
      // if (this.socketID_UserEntity.delete(client.id) === false) {
      //   this.logger.debug("Critical logic error, trying to removed a client that doesn't exist, should never display");
      // }
    })
  }

  transfer_all_match(@ConnectedSocket() client: Socket) { //utility function
    this.logger.debug("transfering all the match to : ", client.id, this.all_the_match);
    for (let index = 0; index < this.all_the_match.length; index++) {
      const match = this.all_the_match[index];
      this.server.to(client.id).emit("Match_Update", match);
    }
  }
 
  // second_loop() {
  //   let i = 0;
  //   while (true) {
  //     i++;
  //     if (i === 1000000000) {
  //       console.log("out of second loop");
  //       break;
  //     }
  //   }
  // }
 
  // @SubscribeMessage("Test")
  // test_function() {
  //   let i = 0;
  //   while (true) {
  //     i++;
  //     if (i === 1000000000) {
  //       console.log("out of first loop");
  //       break;
  //     }
  //   }
  //   this.second_loop();
  // }
}