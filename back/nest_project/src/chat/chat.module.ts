import { Module } from "@nestjs/common";
import { ChannelModule } from "./channel/channel.module";
import { ChatGateway } from "./chat.gateway";
import { linkUCModule } from "./link_users_channels/linkUC.module";
import { MessageModule } from "./message/message.module";
// import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { WsJwtStrategy } from "./websocket.strategy";
import { ChatService } from "./chat.service";

@Module({
	imports: [
		ChannelModule,
		MessageModule,
		linkUCModule
	],
	providers: [ChatGateway, WsJwtStrategy, ChatService],
	exports: [ChatService]
})
export class ChatModule {}