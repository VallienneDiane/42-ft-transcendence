import { Module } from "@nestjs/common";
import { ChannelModule } from "./channel/channel.module";
import { ChatGateway } from "./chat.gateway";
import { linkUCModule } from "./link_users_channels/linkUC.module";
import { MessageModule } from "./message/message.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { WsJwtStrategy } from "./websocket.strategy";

@Module({
	imports: [
		ChannelModule,
		MessageModule,
		PassportModule.register({             
            defaultStrategy: 'websocket',
            session: false,
        }),
        JwtModule.register({
            secret: process.env.SECRET, 
            signOptions: { expiresIn: '1d' },
        }),
		linkUCModule
	],
	providers: [ChatGateway, WsJwtStrategy],
	exports: [PassportModule, JwtModule]
})
export class ChatModule {}