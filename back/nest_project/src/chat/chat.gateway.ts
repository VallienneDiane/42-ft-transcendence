import { MessageBody, SubscribeMessage, WebSocketGateway, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from "@nestjs/websockets";
import { Server, Socket, Namespace } from 'socket.io';
import { Logger, UsePipes, ValidationPipe } from "@nestjs/common";
import { IToken } from "./chat.interface";
import * as jsrsasign from 'jsrsasign';
import { ChatService } from "./chat.service";
import { UserRoomHandler } from "./chat.classes";
import { UserService } from "src/user/user.service";
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from "src/user/user.entity";
import { friendDto } from "./relation/friend/friend.dto";
import { addMessageDto, blockUserDto, changeLocDto, channelIdDto, createChannelDto, inviteUserDto, joinChannelDto, kickUserDto, makeHimNoOpDto, makeHimOpDto, modifyChannelDto } from "./chat.gateway.dto";

@UsePipes(ValidationPipe)
@WebSocketGateway({transports: ['websocket'], namespace: '/chat'})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private logger: Logger = new Logger('ChatGateway');
    private io: Server;
    private chatNamespace: Namespace;
    private chatRoomHandler: UserRoomHandler;

    constructor(
        private chatService: ChatService,
        private userService: UserService,
        private jwtService: JwtService ) 
    {}

    private extractUserId(client: Socket): string {
        let token = client.handshake.auth['token'];
        if (token != null) {
            try {
                const decoded = this.jwtService.verify(token, {
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
        return this.userService.findById(id);    
    }

    afterInit() {
        this.io = new Server();
        this.chatNamespace = this.io.of('/chat');
        this.chatRoomHandler = new UserRoomHandler();
    }

    handleConnection(client: Socket) {
        // this.logger.debug(`${client.id} tente de se connecter`)
        this.tokenChecker(client)
        .then( (user) => {
            // this.logger.debug(`${client.id} est connecté`)
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
                this.chatService.disconnectEvent(client, user, this.chatNamespace, this.chatRoomHandler, this.logger)
        })
    }

    @SubscribeMessage('addMessage')
    handleNewMessage(@MessageBody() data: addMessageDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.newMessageEvent(client, user, this.chatRoomHandler, this.logger, data.message);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('changeLoc')
    handleChangeLoc(@MessageBody() data: changeLocDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null) {
                this.logger.debug('changeLoc event : ');
                this.chatService.changeLocEvent(client, user.id, data.loc, data.isChannel, this.chatRoomHandler);
            }
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    /**
     * liste tous les channels dans lequels je ne suis pas enregistré.e
     * @param client 
     */
    @SubscribeMessage('listChannel')
    handlelistChannel(@ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null) {
                this.logger.debug(`${client.id} : listChannel`)
                this.chatService.listChannelEvent(client, user.id);
            }
        })
    }

    @SubscribeMessage('listUsersChann')
    handlelistUsersChann(@MessageBody() data: channelIdDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.listUsersInChannel(client, data.channelId, this.chatRoomHandler);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }
    
    @SubscribeMessage('joinChannel')
    handleJoinChannel(@MessageBody() data: joinChannelDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.joinChannelEvent(client, user, data, this.chatRoomHandler);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('inviteUser')
    handleInviteUser(@MessageBody() data: inviteUserDto, @ConnectedSocket() client: Socket) {
        console.log(data);
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.inviteUserEvent(client, user.id, this.chatRoomHandler, this.logger, data.userToInvite, data.channelId);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('createChannel')
    handleCreateChannel(@MessageBody() data: createChannelDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.createChannelEvent(client, user, this.chatRoomHandler, this.logger, data);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('modifyChannel')
    handleModifyChannel(@MessageBody() data: modifyChannelDto, @ConnectedSocket() client: Socket) {
        this.logger.debug(`modifyChannel Event`);
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.modifyChannelEvent(client, user, this.chatRoomHandler, this.logger, data);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('leaveChannel')
    handleLeaveChannel(@MessageBody() data: channelIdDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.leaveChannelEvent(client, user, this.chatRoomHandler, this.logger, data.channelId);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('destroyChannel')
    handleDestroyChannel(@MessageBody() data: channelIdDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.destroyChannelEvent(client, user, data.channelId, this.chatRoomHandler);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('kickUser')
    handleKickUser(@MessageBody() data: kickUserDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.kickUserEvent(client, user.id, this.chatRoomHandler, this.logger, data.userToKick, data.channelId);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('makeHimOp')
    handleMakeHimOp(@MessageBody() data: makeHimOpDto, @ConnectedSocket() client: Socket) {
        this.logger.debug("OP");
        console.log(data);
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.makeHimOpEvent(client, user.id, this.chatRoomHandler, this.logger, data.userToOp, data.channelId);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('makeHimNoOp')
    handleMakeHimNoOp(@MessageBody() data: makeHimNoOpDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null)
                this.chatService.makeHimNoOpEvent(client, user.id, this.chatRoomHandler, this.logger, data.userToNoOp, data.channelId);
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    /**
     * liste tous les channels dont je fais partie
     * @param client 
     */
    @SubscribeMessage('myChannels')
    handleMyChannels(@ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null) {
                this.logger.debug(`${user.id} : listMyChannels`)
                this.chatService.listMyChannelEvent(client, user.id);
            }
        })
    }

    /**
     * liste tous les users a qui j'ai déjà envoyé un message
     * @param client 
     */
    @SubscribeMessage('myDM')
    handleListMyDM(@ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null) {
                this.logger.debug(`${user.id} : listMyDMs`)
                this.chatService.listMyDMEvent(client, user, this.chatRoomHandler);
            }
        })
    }

    @SubscribeMessage('friendRequest')
    handleFriendRequest(@MessageBody() data: friendDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((sender) => {
            if (sender != null) {
                this.chatService.friendRequestEvent(client, sender, data.userId, this.chatRoomHandler);
            }
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }


    @SubscribeMessage('acceptFriendRequest')
    handleAcceptRequest(@MessageBody() data: friendDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((receiver) => {
            if (receiver != null) {
                this.chatService.acceptFriendRequestEvent(receiver, data.userId, this.chatRoomHandler);
            }
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }


    @SubscribeMessage('rejectFriendRequest')
    handleRejectRequest(@MessageBody() data: friendDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((receiver) => {
            if (receiver != null) {
                this.chatService.rejectFriendRequestEvent(receiver, data.userId, this.chatRoomHandler);
            }
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage('unfriend')
    handleUnfriend(@MessageBody() data: friendDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((me) => {
            if (me != null) {
                this.chatService.unfriendEvent(me, data.userId, this.chatRoomHandler);
            }
            else
                client.emit('notice', 'Your token is invalid, please log out then sign in');
        })
    }

    @SubscribeMessage("blockUser")
    handleBlockUser(@MessageBody() data: blockUserDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null) {
                this.logger.debug(`block event`);
                this.chatService.blockUserEvent(client, user, data.id, this.chatRoomHandler);
                this.chatService.unfriendEvent(user, data.id, this.chatRoomHandler);
            }
        })
    }

    @SubscribeMessage("unblockUser")
    handleUnblockUser(@MessageBody() data: blockUserDto, @ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null) {
                this.logger.debug(`block event`);
                this.chatService.unblockUserEvent(client, user, data.id, this.chatRoomHandler);
            }
        })
    }

    @SubscribeMessage("listBlock")
    handleListBlock(@ConnectedSocket() client: Socket) {
        this.tokenChecker(client)
        .then((user) => {
            if (user != null) {
                this.logger.debug(`listBlock event`);
                this.chatService.listBlockEvent(client, user.id);
            }
        })
    }

}