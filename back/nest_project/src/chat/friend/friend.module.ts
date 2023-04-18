import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FriendEntity } from "./friend.entity";
import { FriendService } from "./friend.service";
import { FriendController } from "./friend.controller";
import { JwtStrategy } from "src/auth_strategies/jwt.strategy";
import { UserModule } from "src/user/user.module";

@Module({
	imports: [TypeOrmModule.forFeature([FriendEntity]), UserModule],
	controllers: [FriendController],
	providers: [FriendService, JwtStrategy], //  seulement ces fonctions ont accès à la table Friend
	exports: [FriendService],
})
export class FriendModule {}