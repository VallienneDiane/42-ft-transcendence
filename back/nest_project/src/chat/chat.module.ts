import { Module } from "@nestjs/common";
import { ChannelModule } from "./channel/channel.module";
import { ChatGateway } from "./chat.gateway";
import { linkUCModule } from "./link_users_channels/linkUC.module";
import { MessageModule } from "./message/message.module";
// import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ChatService } from "./chat.service";

@Module({
	imports: [
		ChannelModule,
		MessageModule,
		linkUCModule,
		JwtModule.register({
            secret: process.env.SECRET, 
            signOptions: { expiresIn: '1d' },
        }),
	],
	providers: [ChatGateway, ChatService],
	exports: [ChatService, JwtModule]
})
export class ChatModule {}