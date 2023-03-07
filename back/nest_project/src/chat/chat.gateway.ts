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

    private socketMap: Map<string, Socket> = new Map<string, Socket>;

    private iHandlerisator(client: Socket, message?: IMessageChat, channel?: IChannel): IHandle {
        return {
            chatNamespace: this.chatNamespace,
            client: client,
            socketMap: this.socketMap,
            logger: this.logger,
            message: message,
            channelEntries: channel
        };
    }

    afterInit() {
        this.io = new Server();
        this.chatNamespace = this.io.of('/chat');
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
        this.chatService.newMessageEvent(this.iHandlerisator(client, blop));
    }

    @SubscribeMessage('changeLoc')
    handleChangeLoc(@MessageBody() data: IMessageChat, @ConnectedSocket() client: Socket) {
        this.chatService.changeLocEvent(this.iHandlerisator(client, data));
    }
    
    @SubscribeMessage('joinChannel')
    handleJoinChannel(@MessageBody() data: IChannel, @ConnectedSocket() client: Socket) {
        this.chatService.joinChannelEvent(this.iHandlerisator(client, undefined, data));
    }

    @SubscribeMessage('createChannel')
    handleCreateChannel(@MessageBody() data: IChannel, @ConnectedSocket() client: Socket) {
        this.chatService.createChannelEvent(this.iHandlerisator(client, undefined, data));
    }
}
