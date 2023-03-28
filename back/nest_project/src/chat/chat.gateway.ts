import { MessageBody, SubscribeMessage, WebSocketGateway, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from "@nestjs/websockets";
import { Server, Socket, Namespace } from 'socket.io';
import { Logger, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IChannel, IHandle, IMessageChat, IToken } from "./chat.interface";
import * as jsrsasign from 'jsrsasign';
import { ChatService } from "./chat.service";
import { UserRoomHandler } from "./chat.classes";
import { useContainer } from "class-validator";
import { UserService } from "src/user/user.service";
import { UserDto } from "src/user/user.dto";
import { JwtService } from '@nestjs/jwt';
import { ChannelEntity } from "./channel/channel.entity";

@WebSocketGateway({transports: ['websocket'], namespace: '/chat'})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private logger: Logger = new Logger('ChatGateway');
    private io: Server;
    private chatNamespace: Namespace;
    private chatRoomHandler: UserRoomHandler;

    constructor(
        private chatService: ChatService,
        private userService: UserService,
        private jwtService: JwtService
    ) 
    {}

    private extractUserId(client: Socket): string {
        let token = client.handshake.auth['token'];
        if (token != null) {
            const decoded = this.jwtService.verify(token, {
                secret: process.env.SECRET,
        });} // revoir message d'erreur à afficher
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

    private tokenChecker(client: Socket): Promise<UserDto> {
        let id = this.extractUserId(client);
        return this.userService.findById(id);    
    }

    afterInit() {
        this.io = new Server();
        this.chatNamespace = this.io.of('/chat');
        this.chatRoomHandler = new UserRoomHandler();
    }

    handleConnection(client: Socket) {
        this.tokenChecker(client)
        .then( (user) => {
            if (user != null)
                this.chatService.connectEvent(client, user, this.chatNamespace, this.chatRoomHandler, this.logger);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    handleDisconnect(client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.disconnectEvent(user, this.chatNamespace, this.chatRoomHandler, this.logger)
        })
    }

    @SubscribeMessage('addMessage')
    handleNewMessage(@MessageBody() message: string, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.newMessageEvent(client, user, this.chatRoomHandler, this.logger, message);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('changeLoc')
    handleChangeLoc(@MessageBody() data: {Loc: string, isChannel: boolean}, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null) {
                this.logger.debug('changeLoc event : ');
                console.log(data, data.Loc, data.isChannel);
                this.chatService.changeLocEvent(client, user, data.Loc, data.isChannel, this.chatRoomHandler);
            }
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('listChannel')
    handlelistChannel(@ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.listChannelEvent(client, user.login);
        })
    }

    @SubscribeMessage('listUsersChann')
    handlelistUsersChann(@MessageBody() channelName: string, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.listUsersInChannel(client, channelName);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }
    
    @SubscribeMessage('joinChannel')
    handleJoinChannel(@MessageBody() data: {channelName: string, channelPass: string}, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.joinChannelEvent(client, user.login, data, this.chatRoomHandler);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('inviteUser')
    handleInviteUser(@MessageBody() data: {userToInvite: string, channel: string}, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.inviteUserEvent(client, user.login, this.chatRoomHandler, this.logger, data.userToInvite, data.channel);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('createChannel')
    handleCreateChannel(@MessageBody() data: ChannelEntity, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.createChannelEvent(client, user.login, this.chatRoomHandler, this.logger, data);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('leaveChannel')
    handleLeaveChannel(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.leaveChannelEvent(client, user.login, this.chatRoomHandler, this.logger, data);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('kickUser')
    handleKickUser(@MessageBody() data: {userToKick: string, channel: string}, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.kickUserEvent(client, user.login, this.chatRoomHandler, this.logger, data.userToKick, data.channel);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('makeHimOp')
    handleMakeHimOp(@MessageBody() data: {userToOp: string, channel: string}, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.makeHimOpEvent(client, user.login, this.chatRoomHandler, this.logger, data.userToOp, data.channel);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('makeHimNoOp')
    handleMakeHimNoOp(@MessageBody() data: {userToNoOp: string, channel: string}, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.makeHimNoOpEvent(client, user.login, this.chatRoomHandler, this.logger, data.userToNoOp, data.channel);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('myChannels')
    handleMyChannels(@ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.listMyChannelEvent(client, user.login);
        })
    }

    @SubscribeMessage('myDM')
    handleListMyDM(@ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.listMyDMEvent(client, user.login, this.chatRoomHandler);
        })
    }

}