import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Match } from "./Match";
import { MatchController } from "./Match.controllers";
import { MatchService } from "./Match.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Match]),
    ],
    controllers: [MatchController],
    providers: [MatchService],
})
export class MatchModule {}