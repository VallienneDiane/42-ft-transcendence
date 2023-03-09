import { MessageBody, SubscribeMessage, WebSocketGateway, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from "@nestjs/websockets";
import { Server, Socket, Namespace } from 'socket.io';
import { Logger, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { IChannel, IHandle, IMessageChat } from "./chat.interface";
import { ChatService } from "./chat.service";

@WebSocketGateway({transports: ['websocket'], namespace: '/chat'})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private logger: Logger = new Logger('ChatGateway');
    private io: Server;
    private chatNamespace: Namespace;
    constructor(
        private chatService: ChatService
    ) 
    {}

    private socketRoomMap: Map<string, Map<string, Socket> > = new Map<string, Map<string, Socket> >;
    private loginRoom: Map<string, {room: string, isChannel: boolean}> = new Map<string, {room: string, isChannel: boolean}>();

    private iHandlerisator(client: Socket, message?: IMessageChat, channel?: IChannel): IHandle {
        return {
            chatNamespace: this.chatNamespace,
            client: client,
            socketRoomMap: this.socketRoomMap,
            loginRoom: this.loginRoom,
            logger: this.logger,
            message: message,
            channelEntries: channel
        };
    }

    afterInit() {
        this.io = new Server();
        this.chatNamespace = this.io.of('/chat');
        this.socketRoomMap.set("general", new Map<string, Socket>());
    }

    // @UseGuards(AuthGuard('websocket'))
    handleConnection(client: Socket) {
		this.chatService.connectEvent(this.iHandlerisator(client));
    }

    handleDisconnect(client: Socket) {
		this.chatService.disconnectEvent(this.iHandlerisator(client))
    }

    @SubscribeMessage('addMessage')
    handleNewMessage(@MessageBody() blop: IMessageChat, @ConnectedSocket() client: Socket) {
        console.log('msg to send : ', blop.content, blop.room, blop.isChannel);
        this.chatService.newMessageEvent(this.iHandlerisator(client, blop));
    }

    @SubscribeMessage('changeLoc')
    handleChangeLoc(@MessageBody() data: {Loc: string, isChannel: boolean}, @ConnectedSocket() client: Socket) {
        this.chatService.changeLocEvent(client, {Loc: data.Loc, isChannel: data.isChannel, loginRoom: this.loginRoom, socketRoomMap: this.socketRoomMap});
    }

    @SubscribeMessage('listChannel')
    handlelistChannel(@ConnectedSocket() client: Socket) {
        this.chatService.listChannelEvent(client);
    }
    
    @SubscribeMessage('joinChannel')
    handleJoinChannel(@MessageBody() data: IChannel, @ConnectedSocket() client: Socket) {
        this.chatService.joinChannelEvent(this.iHandlerisator(client, undefined, data));
    }

    @SubscribeMessage('createChannel')
    handleCreateChannel(@MessageBody() data: IChannel, @ConnectedSocket() client: Socket) {
        this.chatService.createChannelEvent(this.iHandlerisator(client, undefined, data));
    }

    @SubscribeMessage('myChannels')
    handleMyChannels(@ConnectedSocket() client: Socket) {
        this.chatService.listMyChannelEvent(client);
    }

}
