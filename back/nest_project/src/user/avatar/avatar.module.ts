import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AvatarEntity } from "./avatar.entity";
import { AvatarService } from "./avatar.service";

@Module({
    imports:
    [
        TypeOrmModule.forFeature([AvatarEntity]),
    ],
    providers: [AvatarService],
    exports: [AvatarService]
})
export class AvatarModule {}