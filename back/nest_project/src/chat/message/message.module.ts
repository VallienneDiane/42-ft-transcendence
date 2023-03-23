import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChannelModule } from "../channel/channel.module";
import { ChannelService } from "../channel/channel.service";
import { linkUCModule } from "../link_users_channels/linkUC.module";
import { LinkUCService } from "../link_users_channels/linkUC.service";
import { MessageEntity } from "./message.entity";
import { MessageService } from "./message.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([MessageEntity])
    ],
    providers: [MessageService],
    exports: [MessageService]
})
export class MessageModule {}