import { Inject, Injectable } from "@nestjs/common";
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
		@Inject(UserService)
		private readonly userService: UserService,
	) {}

	async create(sender: UserEntity, receiver: UserEntity): Promise<FriendEntity> {
		const newFriend: FriendEntity = {
			id: undefined,
			sender: sender,
			receiver: receiver,
			state: 'pending'
		};
		return await this.friendRepository.save(newFriend);
	}

	async checkRequest(idA: string, idB: string): Promise<boolean> {
		const requestsSend: FriendEntity[] = await this.userService.getFriendRequestsSend(idA);
		const requestsReceived: FriendEntity[] = await this.userService.getFriendRequestsReceived(idB);
		
		requestsSend.forEach((request) => {
			if (request.receiver.id === idB)
				return false;
		})
		requestsReceived.forEach((request) => {
			if (request.sender.id === idB)
				return false;
		})
		return true;
	}

	async getList(id: string): Promise<UserEntity[]> {
		const requestsSend: FriendEntity[] = await this.userService.getFriendRequestsSend(id);
		const requestsReceived: FriendEntity[] = await this.userService.getFriendRequestsReceived(id);
		const fullList: FriendEntity[] = [...requestsSend, ...requestsReceived];
		const friendList: UserEntity[] = [];
		for (let link of fullList) {
			if (link.state === "friend") {
				if (link.sender.id === id)
					friendList.push(link.receiver);
				else
					friendList.push(link.sender);
			}
		}
		return friendList;
	}

	async getRequestPendingSend(id: string): Promise<UserEntity[]> {
		const requestsSend: FriendEntity[] = await this.userService.getFriendRequestsSend(id);
		const list: UserEntity[] = [];
		for (let link of requestsSend) {
			if (link.state === "pending") {
				list.push(link.receiver);
			}
		}
		return list;
	}

	async getRequestPendingReceived(id: string): Promise<UserEntity[]> {
		const requestsReceived: FriendEntity[] = await this.userService.getFriendRequestsReceived(id);
		const list: UserEntity[] = [];
		for (let link of requestsReceived) {
			if (link.state === "pending") {
				list.push(link.sender);
			}
		}
		return list;
	}

}