import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChannelEntity } from "./channel.entity";
import { ChannelService } from "./channel.service";

@Module({
	imports: [
		TypeOrmModule.forFeature([ChannelEntity])
	],
	providers: [ChannelService],
	exports: [ChannelService],
})
export class ChannelModule {}