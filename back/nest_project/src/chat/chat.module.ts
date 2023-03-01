import { Module } from "@nestjs/common";
import { ChannelModule } from "./channel/channel.module";
import { ChatGateway } from "./chat.gateway";
import { MessageModule } from "./message/message.module";

@Module({
	imports: [
		ChannelModule,
		MessageModule
	],
	providers: [ChatGateway]
})
export class ChatModule {}