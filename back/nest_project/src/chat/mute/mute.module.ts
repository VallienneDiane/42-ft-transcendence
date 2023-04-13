import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "src/user/user.module";
import { ChannelModule } from "../channel/channel.module";
import { MuteEntity } from "./mute.entity";
import { MuteService } from "./mute.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([MuteEntity]),
        ChannelModule,
        UserModule
    ],
    providers: [MuteService],
    exports: [MuteService]
})
export class MuteModule {}