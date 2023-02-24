import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MessageEntity } from "./message.entity";
import { MessageService } from "./message.service"
import { MessageGateway } from "./message.gateway"

@Module({
    imports: [
        TypeOrmModule.forFeature([MessageEntity])
    ],
    providers: [MessageService, MessageGateway],
    exports: [MessageService],
})
export class MessageModule {}