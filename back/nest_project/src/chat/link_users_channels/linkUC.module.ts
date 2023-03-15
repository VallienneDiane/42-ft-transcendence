import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChannelModule } from "../channel/channel.module";
import { ChannelService } from "../channel/channel.service";
import { MessageModule } from "../message/message.module";
import { MessageService } from "../message/message.service";
import { LinkUCEntity } from "./linkUC.entity";
import { LinkUCService } from "./linkUC.service";

@Module({
	imports: [
		forwardRef(() => ChannelModule),
		forwardRef(() => MessageModule),
		TypeOrmModule.forFeature([LinkUCEntity])
	],
	providers: [LinkUCService],
	exports: [LinkUCService],
})
export class linkUCModule {}