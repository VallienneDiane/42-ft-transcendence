import { Module } from "@nestjs/common";
import { ChannelModule } from "./channel/channel.module";
import { ChatGateway } from "./chat.gateway";
import { linkUCModule } from "./link_users_channels/linkUC.module";
import { MessageModule } from "./message/message.module";

@Module({
	imports: [
		ChannelModule,
		MessageModule,
		linkUCModule
	],
	providers: [ChatGateway]
})
export class ChatModule {}