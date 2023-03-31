import { Module } from "@nestjs/common";
import { ChannelModule } from "./channel/channel.module";
import { ChatGateway } from "./chat.gateway";
import { JwtModule } from "@nestjs/jwt";
import { ChatService } from "./chat.service";
import { UserModule } from "src/user/user.module";
import { MessageChannelModule } from "./messageChannel/messageChannel.module";
import { MessagePrivateModule } from "./messagePrivate/messagePrivate.module";

@Module({
	imports: [
		UserModule,
		ChannelModule,
		MessageChannelModule,
		MessagePrivateModule,
		JwtModule.register({
            secret: process.env.SECRET, 
            signOptions: { expiresIn: '1d' },
        }),
	],
	providers: [ChatGateway, ChatService],
	exports: [ChatService, JwtModule]
})
export class ChatModule {}