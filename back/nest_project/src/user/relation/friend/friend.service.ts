import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "src/user/user.entity";
import { UserService } from "src/user/user.service";
import { Repository } from "typeorm";
import { FriendEntity } from "./friend.entity";

@Injectable({})
export class FriendService {
	constructor (
		@InjectRepository(FriendEntity)
		private readonly friendRepository: Repository<FriendEntity>,
		private readonly userService: UserService,
	) {}

	async create(sender: UserEntity, receiver: UserEntity): Promise<FriendEntity> {
		let newFriend: FriendEntity = {
			id: undefined,
			sender: sender,
			receiver: receiver,
			state: 'pending'
		};
		return await this.friendRepository.save(newFriend);
	}

	// async checkRequest()
}