import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MessageChannelEntity } from "./messageChannel.entity";
import { MessageChannelService } from "./messageChannel.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([MessageChannelEntity])
    ],
    providers: [MessageChannelService],
    exports: [MessageChannelService]
})
export class MessageChannelModule {}