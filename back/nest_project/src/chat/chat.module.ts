import { Module } from "@nestjs/common";
import { ChannelModule } from "./channel/channel.module";
import { ChatGateway } from "./chat.gateway";
import { linkUCModule } from "./link_users_channels/linkUC.module";
import { MessageModule } from "./message/message.module";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { WsJwtStrategy } from "./websocket.strategy";
import { ChatService } from "./chat.service";
import { UserService } from "src/user/user.service";
import { UserEntity } from "src/user/user.entity";
import { AppModule } from "src/app.module";
import { UserModule } from "src/user/user.module";

@Module({
	imports: [
		UserModule,
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
	providers: [ChatGateway, WsJwtStrategy, ChatService],
	exports: [PassportModule, JwtModule, ChatService]
})
export class ChatModule {}