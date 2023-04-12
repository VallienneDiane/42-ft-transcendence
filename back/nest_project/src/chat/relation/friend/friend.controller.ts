import { Body, Controller, Get, Param, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { FriendService } from "./friend.service";
import { UserService } from "src/user/user.service";
import { UserEntity } from "src/user/user.entity";
import { friendDto } from "./friend.dto";
import { JwtAuthGuard } from "src/auth_strategies/jwt-auth.guard";

@UsePipes(ValidationPipe)
@Controller()
export class FriendController {
	constructor(
		private friendService: FriendService) {}

	@UseGuards(JwtAuthGuard)
	@Get('listFriends/:user')
	async listFriends(@Param('user') data: friendDto): Promise<UserEntity[]> {
        return await this.friendService.getList(data.userId);
    }

	@UseGuards(JwtAuthGuard)
	@Get('listRequestsPendingSend/:user')
	async listRequestsPendingSend(@Param('user') data: friendDto): Promise<UserEntity[]> {
        return await this.friendService.getRequestPendingSend(data.userId);
    }

	@UseGuards(JwtAuthGuard)
	@Get('listRequestsPendingReceived/:user')
	async listRequestsPendingReceived(@Param('user') data: friendDto): Promise<UserEntity[]> {
        return await this.friendService.getRequestPendingReceived(data.userId);
    }
}
