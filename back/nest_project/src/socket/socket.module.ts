import { Module } from "@nestjs/common";
import { PingEvent, Chat } from "./socketEvents";

@Module({
    providers: [PingEvent, Chat]
})
export class SocketModule {}