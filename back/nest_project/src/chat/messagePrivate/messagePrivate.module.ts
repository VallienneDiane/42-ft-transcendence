import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MessagePrivateEntity } from "./messagePrivate.entity";
import { MessagePrivateService } from "./messagePrivate.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([MessagePrivateEntity])
    ],
    providers: [MessagePrivateService],
    exports: [MessagePrivateService]
})
export class MessagePrivateModule {}