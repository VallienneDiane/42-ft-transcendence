import { Body, Controller, Post, UseGuards } from "@nestjs/common";
// import { JwtAuthGuard } from "../auth_strategies/jwt-auth.guard";
import { JwtService } from "@nestjs/jwt";
import { FriendService } from "./friend.service";
import { UserService } from "src/user/user.service";
import { UserEntity } from "src/user/user.entity";


@Controller()
export class FriendController {
	constructor(
		private friendService: FriendService,
		private userService: UserService) {}

	// @UseGuards(JwtAuthGuard)
	@Post('friendRequest')
	async create(@Body() senderId: string, receiverId: string) {
		let sender: UserEntity = await this.userService.findById(senderId);
		let receiver: UserEntity = await this.userService.findById(receiverId);
		await this.friendService.create(sender, receiver);
	}
}