import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { linkUCModule } from "../link_users_channels/linkUC.module";
import { LinkUCService } from "../link_users_channels/linkUC.service";
import { MessageModule } from "../message/message.module";
import { MessageService } from "../message/message.service";
import { ChannelEntity } from "./channel.entity";
import { ChannelService } from "./channel.service";

@Module({
	imports: [
		forwardRef(() => linkUCModule),
		forwardRef(() => MessageModule),
		TypeOrmModule.forFeature([ChannelEntity])
	],
	providers: [ChannelService],
	exports: [ChannelService],
})
export class ChannelModule {}