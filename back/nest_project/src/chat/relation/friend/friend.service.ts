import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IRequest } from "src/chat/chat.interface";
import { UserEntity } from "src/user/user.entity";
import { UserService } from "src/user/user.service";
import { Brackets, Repository } from "typeorm";
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
		const requestsSend: IRequest[] = await this.userService.getFriendRequestsSend(idA);
		const requestsReceived: IRequest[] = await this.userService.getFriendRequestsReceived(idB);
		
		requestsSend.forEach((request) => {
			if (request.receiverId === idB)
				return false;
		})
		requestsReceived.forEach((request) => {
			if (request.senderId === idB)
				return false;
		})
		return true;
	}

	async getFriendsList(id: string): Promise<{friendshipId: string, friendId: string, friendName: string}[]> {
		const requestsSend: IRequest[] = await this.userService.getFriendRequestsSend(id);
		const requestsReceived: IRequest[] = await this.userService.getFriendRequestsReceived(id);
		const fullList: IRequest[] = [...requestsSend, ...requestsReceived];
		const friendList: {friendshipId: string, friendId: string, friendName: string}[] = [];
		for (let link of fullList) {
			if (link.state === "friend") {
				if (link.senderId === id) {
					const receiver: UserEntity = await this.userService.findById(link.receiverId);
					friendList.push({friendshipId: link.id, friendId: receiver.id, friendName: receiver.login});
				}
				else {
					const sender: UserEntity = await this.userService.findById(link.senderId);
					friendList.push({friendshipId: link.id, friendId: sender.id, friendName : sender.login});
				}
			}
		}
		return friendList;
	}

	async getRequestPendingSend(id: string): Promise<{id: string, name: string}[]> {
		const requestsSend: IRequest[] = await this.userService.getFriendRequestsSend(id);
		// if (requestsSend)
		const list: {id: string, name: string}[] = [];
		for (let link of requestsSend) {
			// console.log(link)
			const receiver: UserEntity = await this.userService.findById(link.receiverId);
			if (link.state === "pending") {
				list.push({id: receiver.id, name : receiver.login});
			}
		}
		return list;
	}

	async getRequestPendingReceived(id: string): Promise<{id: string, name: string}[]> {
		const requestsReceived: IRequest[] = await this.userService.getFriendRequestsReceived(id);
		const list: {id: string, name: string}[] = [];
		for (let link of requestsReceived) {
			const sender: UserEntity = await this.userService.findById(link.senderId);
			if (link.state === "pending") {
				list.push({id: sender.id, name : sender.login});
			}
		}
		return list;
	}

	async findRequest(senderId: string, receiverId: string): Promise<FriendEntity> {
		const sender: UserEntity = await this.userService.findById(senderId);
		const receiver: UserEntity = await this.userService.findById(receiverId);
		return await this.friendRepository.findOne({where: {sender: sender, receiver: receiver}})
	}

	async updateRequest(requestToUpdate: string): Promise<void> {
		this.friendRepository.update({id: requestToUpdate}, {state: "friend"});
	}

	async deleteRequest(requestToUpdate: string): Promise<void> {
		this.friendRepository.delete({id: requestToUpdate});
	}
}
