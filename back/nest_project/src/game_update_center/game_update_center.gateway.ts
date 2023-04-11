import { Logger, OnModuleInit } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameEngineService } from 'src/game_engine/game_engine.service';
import { PongEngineService } from 'src/pong_engine/pong_engine.service';
import { OnGatewayInit } from '@nestjs/websockets';
import { UserService } from 'src/user/user.service';
import { MatchService } from 'src/match/Match.service';
import * as jsrsasign from 'jsrsasign';
import { JwtService } from '@nestjs/jwt';
import { IToken } from 'src/chat/chat.interface';
import { UserEntity } from "src/user/user.entity";
import { GameInputDTO, PrivateGameRequestDTO, PublicGameRequestDTO, SharePlayersLoginDTO } from './game_update_center.dto';

/**
 * use for storing the client waiting for a private matchmaking
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
  player: Socket[];
  spectator: Socket[];
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

  game_instance: Game_Instance[]; // all gane instance
  logger: Logger = new Logger("GameGateway"); // use to log thing into the console (inside the container)
  public_space: Waiting_Socket[]; // waiting room for public matchmaking
  private_space: Waiting_Socket[]; // waiting room for private matchmaking
  socketID_UserEntity: Map<string, UserEntity>; // map all the socket with their login

  constructor(
    private userservice: UserService,
    private matchservice: MatchService,
    private jwtservice: JwtService
  ) 
  {
    this.game_instance = [];
    this.public_space = [];
    this.private_space = [];
    this.socketID_UserEntity = new Map<string, UserEntity>();
  }

  @WebSocketServer()
  server: Server;
  /**
   * take the socket in the public game room and shove them into a room to start a game instance for them
   * @param client the second player socket
   */
  StartGameRoom(@ConnectedSocket() player1: Socket, @ConnectedSocket() player2: Socket, super_game_mode: boolean) {
    // make the player join the room of name player1.socket.id
    player1.join(player1.id);
    player2.join(player1.id);

    // set a game instance for the player and add it to the game instance []
    let p = new Game_Instance();
    if (super_game_mode === true) { p.game_engine = new GameEngineService(this.userservice, this.matchservice); }
    else { p.game_engine = new PongEngineService(this.userservice, this.matchservice); }
  
    p.game_engine.set_player(player1, player2, this.socketID_UserEntity.get(player1.id), this.socketID_UserEntity.get(player2.id));
    p.player = [];
    p.spectator = [];
    p.player.push(player1);
    p.player.push(player2);
    this.game_instance.push(p);

    // emit the Player struct to the front to display the player login
    let players = new SharePlayersLoginDTO();
    players.player1_login = this.socketID_UserEntity.get(player1.id).login;
    players.player2_login = this.socketID_UserEntity.get(player2.id).login;
    this.server.to(player1.id).emit('players', players);
    this.logger.debug("a game room has been created");
  }
  
  /**
   * match two player according to the game type they want to play
   * @param client the client Socket
   * @param body a PublicGameRequestDTO that contain the game type the user want to play
   * @returns nothing
   */
  @SubscribeMessage('public matchmaking')
  handlePublicMatchmaking(@ConnectedSocket() client: Socket,@MessageBody() body: PublicGameRequestDTO) {
    for (let index = 0; index < this.public_space.length; index++) {
      const element = this.public_space[index];
      if (element.super_game_mode === body.super_game_mode) {
        this.logger.debug("client : ", element.waiting_client_socket.id, "and client : ", client.id, "have been match together in a game instance with super_game_mode : ", body.super_game_mode);
        this.StartGameRoom(element.waiting_client_socket, client, body.super_game_mode);
        this.public_space.splice(index, 1);
        this.logger.debug("game room created");
        return;
      }
    }
    let ws: Waiting_Socket = new Waiting_Socket();
    ws.super_game_mode = body.super_game_mode;
    ws.waiting_client_socket = client;
    ws.target_client_login = "";
    this.public_space.push(ws);
  }

  /**
   * check witch game instance the player ready is in, and set the engin state accordingly,
   * launching the engin loop automaticaly if both player are ready
   * @param client the client clicking on the ready button (Socket from socket.io)
  */
 @SubscribeMessage('ready')
  handleReady(@ConnectedSocket() client: Socket) { // TODO check on the engine side what happen if the player send a ready message in a ongoing match
    for (let i = 0; i < this.game_instance.length; i++) {
      const element = this.game_instance[i];
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

  /**
   * happend on connection to the game page
   * @param client the socket connecting
   */
  async handleConnection(@ConnectedSocket() client: Socket) { // log client connection
    let user_entity = await this.tokenChecker(client);
    if (user_entity === null) {
      console.log("user_entity : ", user_entity, "has no valide token and so was kicked");
      client.leave(client.id);
    }
    this.socketID_UserEntity.set(client.id, user_entity);
    this.logger.debug("client Connected: ", client.id, user_entity.login);
  }
  
  /**
   * find and remove the disconnected client from relevante struc,
   * stop the current match if necessary, and remove the client from known loggin
   * @param client the client disconnected
   */
  handleDisconnect(@ConnectedSocket() client: Socket) { // log client disconnection
    this.logger.log('client Disconnected: ' + client.id);
    this.find_and_remove(client);
    this.socketID_UserEntity.delete(client.id);
  }

  /**
   * 
   * @param client find the client and do the necessary clean-up
   * @returns 
  */
  find_and_remove(@ConnectedSocket() client: Socket) {
    
    // if the client is in a game
    for (let i = 0; i < this.game_instance.length; i++) {
      const game = this.game_instance[i];
      for (let j = 0; j < game.spectator.length; j++) {
        const spec = game.spectator[j];
        if (client === spec) {
          this.server.to(game.player[0].id).emit('spectateur disconnected');
          game.spectator.splice(j, 1);
          return;
        }
      }
      for (let j = 0; j < game.player.length; j++) {
        const player = game.player[j];
        if (player === client) {
          this.server.to(game.player[0].id).emit('player_disconnection', this.socketID_UserEntity.get(player.id).login);
          game.game_engine.stop_game();
          this.game_instance.splice(i, 1);
          return;
        }
      }
    }
    
    // if the client was in pong_public_space
    for (let i = 0; i < this.public_space.length; i++) {
      const ws = this.public_space[i];
      if (ws.waiting_client_socket === client) {
        this.public_space.splice(i, 1);
        return;
      }
    }

    // if the client was waiting for a private match
    for (let i = 0; i < this.private_space.length; i++) {
      const ws = this.private_space[i];
      if (ws.waiting_client_socket === client) {
        this.private_space.splice(i, 1);
        return;
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
  handlePrivateMatchmaking(@MessageBody() body: PrivateGameRequestDTO, @ConnectedSocket() client: Socket) {
    for (let i = 0; i < this.private_space.length; i++) {
      const private_waiting_socket = this.private_space[i];
      if (private_waiting_socket.waiting_client_socket === client) {
        this.logger.debug("socketID : ", private_waiting_socket.waiting_client_socket.id, "was already waiting");
        return;
      }
      if (private_waiting_socket.target_client_login === this.socketID_UserEntity.get(client.id).login && body.target === this.socketID_UserEntity.get(private_waiting_socket.waiting_client_socket.id).login) {
        this.logger.debug("private matchmaking occuring");
        this.StartGameRoom(private_waiting_socket.waiting_client_socket, client, body.super_game_mode);
        this.private_space.splice(i, 1);
        return;
      }
    }
    this.logger.debug("no match where found, socket is now waiting for target to accept invit in a super_game_mode : ", body.super_game_mode);
    let private_room = new Waiting_Socket();
    private_room.waiting_client_socket = client;
    private_room.target_client_login = body.target;
    private_room.super_game_mode = body.super_game_mode;
    this.logger.debug("resulting in this object: game: ", private_room.super_game_mode, "\n", private_room.waiting_client_socket.id,"\n", private_room.target_client_login);
    this.private_space.push(private_room);
  }

  /**
   * process the input if the client is a player
   * @param body the input of the client
   * @param client the client
  */
  @SubscribeMessage('Game_Input')
  OnGame_Input(@MessageBody() body: GameInputDTO, @ConnectedSocket() client: Socket) {
    // if the client is in game
    for (let i = 0; i < this.game_instance.length; i++) {
      const game = this.game_instance[i];
      for (let j = 0; j < game.player.length; j++) {
        const player = game.player[j];
        if (player === client) {
          this.logger.debug("client.id : ", client.id, "inputed", body.input);
          game.game_engine.process_input(client, body.input);
          return;
        }
      }
    }
  }

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

  private tokenChecker(client: Socket): Promise<UserEntity> {
    let id = this.extractUserId(client);
    // this.logger.debug(`${id}`)
    return this.userservice.findById(id);    
  }
}