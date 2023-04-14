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
import { addMessageDto, banUserDto, blockUserDto, changeLocDto, channelIdDto, createChannelDto, inviteUserDto, joinChannelDto, kickUserDto, makeHimNoOpDto, makeHimOpDto, modifyChannelDto, muteUserDto, unbanUserDto, unmuteUserDto } from "./chat.gateway.dto";

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
        private jwtService: JwtService
        ) 
    {}

    private extractUserId(client: Socket): {id: string, exp: number} {
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
        let time = object.exp;
        if (new Date(time * 1000) < new Date())
            return null;
        return {id: id, exp: time};
    }

    private async tokenChecker(client: Socket): Promise<{user: UserEntity, exp: number}> {
        let idAndExp = this.extractUserId(client);
        if (idAndExp)
        {
            const userEntity = await this.userService.findById(idAndExp.id);
            if (userEntity)
                return ({user: userEntity, exp: idAndExp.exp});
        }
        return null;
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
            if (user != null) {
                this.chatService.connectEvent(client, user.user, this.chatNamespace, this.chatRoomHandler, this.logger);
                client.data.user = user.user;
                client.data.expire = user.exp;
            }
            else {
                client.emit('notice', 'Your token is invalid, please log out then sign in');
                client.disconnect(true);
            }
        })
    }

    handleDisconnect(client: Socket) {
        if (client.data.user != undefined)
            this.chatService.disconnectEvent(client, client.data.user, this.chatNamespace, this.chatRoomHandler, this.logger)
    }

    @SubscribeMessage('addMessage')
    handleNewMessage(@MessageBody() data: addMessageDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.newMessageEvent(client, client.data.user , this.chatRoomHandler, this.logger, data.message);
    }

    @SubscribeMessage('changeLoc')
    handleChangeLoc(@MessageBody() data: changeLocDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.changeLocEvent(client, client.data.user, data.loc, data.isChannel, this.chatRoomHandler);
    }

    @SubscribeMessage("whereIam")
    handleWhereIam(@ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.whereIamEvent(client, client.data.user.id, this.chatRoomHandler);
    }

    /**
     * liste tous les channels dans lequels je ne suis pas enregistré.e
     * @param client 
     */
    @SubscribeMessage('listChannel')
    handlelistChannel(@ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.listChannelEvent(client, client.data.user.id);
    }

    @SubscribeMessage('listUsersChann')
    handlelistUsersChann(@MessageBody() data: channelIdDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.listUsersInChannel(client, data.channelId, this.chatRoomHandler);
    }
    
    @SubscribeMessage('joinChannel')
    handleJoinChannel(@MessageBody() data: joinChannelDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.joinChannelEvent(client, client.data.user, data, this.chatRoomHandler);
    }

    @SubscribeMessage('inviteUser')
    handleInviteUser(@MessageBody() data: inviteUserDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.inviteUserEvent(client, client.data.user, this.chatRoomHandler, this.logger, data.userToInvite, data.channelId);
    }

    @SubscribeMessage('createChannel')
    handleCreateChannel(@MessageBody() data: createChannelDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.createChannelEvent(client, client.data.user, this.chatRoomHandler, this.logger, data);
    }

    @SubscribeMessage('modifyChannel')
    handleModifyChannel(@MessageBody() data: modifyChannelDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.modifyChannelEvent(client, client.data.user, this.chatRoomHandler, this.logger, data);
    }

    @SubscribeMessage('leaveChannel')
    handleLeaveChannel(@MessageBody() data: channelIdDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)  
            this.chatService.leaveChannelEvent(client, client.data.user, this.chatRoomHandler, this.logger, data.channelId);
    }

    @SubscribeMessage('destroyChannel')
    handleDestroyChannel(@MessageBody() data: channelIdDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)  
            this.chatService.destroyChannelEvent(client, client.data.user, data.channelId, this.chatRoomHandler);
    }

    @SubscribeMessage('kickUser')
    handleKickUser(@MessageBody() data: kickUserDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)  
            this.chatService.kickUserEvent(client, client.data.user.id, this.chatRoomHandler, this.logger, data.userToKick, data.channelId);
    }

    @SubscribeMessage('makeHimOp')
    handleMakeHimOp(@MessageBody() data: makeHimOpDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)  
            this.chatService.makeHimOpEvent(client, client.data.user.id, this.chatRoomHandler, this.logger, data.userToOp, data.channelId);
    }

    @SubscribeMessage('makeHimNoOp')
    handleMakeHimNoOp(@MessageBody() data: makeHimNoOpDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)  
            this.chatService.makeHimNoOpEvent(client, client.data.user.id, this.chatRoomHandler, this.logger, data.userToNoOp, data.channelId);
    }

    /**
     * liste tous les channels dont je fais partie
     * @param client 
     */
    @SubscribeMessage('myChannels')
    handleMyChannels(@ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)  
            this.chatService.listMyChannelEvent(client, client.data.user.id);
    }

    /**
     * liste tous les users a qui j'ai déjà envoyé un message
     * @param client 
     */
    @SubscribeMessage('myDM')
    handleListMyDM(@ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)  
            this.chatService.listMyDMEvent(client, client.data.user, this.chatRoomHandler);
    }

    @SubscribeMessage('friendRequest')
    handleFriendRequest(@MessageBody() data: friendDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)  
            this.chatService.friendRequestEvent(client, client.data.user, data.userId, this.chatRoomHandler);
    }


    @SubscribeMessage('acceptFriendRequest')
    handleAcceptRequest(@MessageBody() data: friendDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.acceptFriendRequestEvent(client.data.user, data.userId, this.chatRoomHandler);
    }


    @SubscribeMessage('rejectFriendRequest')
    handleRejectRequest(@MessageBody() data: friendDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined) 
            this.chatService.rejectFriendRequestEvent(client.data.user, data.userId, this.chatRoomHandler);
    }

    @SubscribeMessage('unfriend')
    handleUnfriend(@MessageBody() data: friendDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.unfriendEvent(client.data.user, data.userId, this.chatRoomHandler);
    }

    @SubscribeMessage("blockUser")
    handleBlockUser(@MessageBody() data: blockUserDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.blockUserEvent(client, client.data.user, data.id, this.chatRoomHandler);
    }

    @SubscribeMessage("unblockUser")
    handleUnblockUser(@MessageBody() data: blockUserDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)  
            this.chatService.unblockUserEvent(client, client.data.user, data.id, this.chatRoomHandler);
    }

    @SubscribeMessage("listBlock")
    handleListBlock(@ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.listBlockEvent(client, client.data.user.id);
    }

    @SubscribeMessage("banUser")
    handleBanUser(@MessageBody() data: banUserDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined) 
            this.chatService.banUserEvent(client, client.data.user.id, data.id, data.channelId, this.logger, this.chatRoomHandler);
    }

    @SubscribeMessage("unbanUser")
    handleUnbanUser(@MessageBody() data: unbanUserDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.unbanUserEvent(client, client.data.user.id, data.name, data.channelId, this.logger, this.chatRoomHandler);
    }

    @SubscribeMessage("muteUser")
    handleMuteUser(@MessageBody() data: muteUserDto, @ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.muteUserEvent(client, client.data.user.id, data.id, data.channelId, data.minutes);
    }

    @SubscribeMessage("listMutedUsers")
    handleListMutedUsers(@ConnectedSocket() client: Socket) {
        if (client.data.user != undefined)
            this.chatService.listMutedUsersEvent(client, this.chatRoomHandler);
    }
}