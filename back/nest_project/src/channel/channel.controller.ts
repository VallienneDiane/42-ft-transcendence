import { Controller } from "@nestjs/common";
import { WebSocketGateway, ConnectedSocket, MessageBody, SubscribeMessage, WebSocketServer } from "@nestjs/websockets";
import { channel } from "diagnostics_channel";
import { Server, Socket } from "socket.io";
import { ChannelService } from "./channel.service";

@Controller()
@WebSocketGateway({transports: ['websocket']})
export class ChannelController {
    constructor(
        private channelService: ChannelService
    )
    {}

    @WebSocketServer()
    server: Server;

    @SubscribeMessage('getHistory')
    handleGetHistory(@MessageBody() channelName: string, @ConnectedSocket() client: Socket) {
        this.channelService.getHistory(channelName, client);
    }

    @SubscribeMessage('join')
    handleJoin(@MessageBody() data: string[], @ConnectedSocket() client: Socket) /*
    data[0] is the channel name
    data[1] is the password of the channel or an empty string if no password is entered
    */
    {
       // this.channelService.create(data[0], )
    }
}