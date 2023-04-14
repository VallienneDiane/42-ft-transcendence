import { Controller, Get, Param, ParseUUIDPipe, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { FriendService } from "./friend.service";
import { friendDto } from "./friend.dto";
import { JwtAuthGuard } from "src/auth_strategies/jwt-auth.guard";
import { isValidationOptions } from "class-validator";
import { UserEntity } from "src/user/user.entity";

@UsePipes(ValidationPipe)
@Controller()
export class FriendController {
	constructor(
		private friendService: FriendService) {}

	@UseGuards(JwtAuthGuard)
	@Get('listFriends/:user')
	async listFriends(@Param('user', ParseUUIDPipe) data: string): Promise<{id: string, name: string}[]> {
		console.log("listUsers: ", data);
        const requestList: {friendshipId: string, friendId: string, friendName: string}[] = await this.friendService.getFriendsList(data);
		const friendList: {id: string, name: string}[] = [];
		for (let elt of requestList) {
			friendList.push({id: elt.friendId, name: elt.friendName});
		}
		return friendList;
    }

	@UseGuards(JwtAuthGuard)
	@Get('listRequestsPendingSend/:user')
	async listRequestsPendingSend(@Param('user', ParseUUIDPipe) data: string): Promise<{id: string, name: string}[]> {
        return await this.friendService.getRequestPendingSend(data);
    }

	@UseGuards(JwtAuthGuard)
	@Get('listRequestsPendingReceived/:user')
	async listRequestsPendingReceived(@Param('user', ParseUUIDPipe) data: string): Promise<{id: string, name: string}[]> {
        return await this.friendService.getRequestPendingReceived(data);
    }
}
