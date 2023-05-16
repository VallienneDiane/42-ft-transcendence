import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Socket } from "socket.io";
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

	async findById(id: string): Promise<FriendEntity> {
		return await this.friendRepository.findOne({where: {id: id}});
	}

	async findByIdWithRelation(id: string): Promise<FriendEntity> {
		const data = await this.friendRepository
			.createQueryBuilder("friend")
			.innerJoinAndSelect("friend.sender", "sender")
			.innerJoinAndSelect("friend.receiver", "receiver")
			.where("friend.id = :id", { id: id })
			.getOne();
		return data;
	}

	async checkRequest(client: Socket, idA: string, idB: string): Promise<{state: number, requestId: string}> {
		let state: number = 0;
		let requestId: string = "";
		const requestsSend: IRequest[] = await this.userService.getFriendRequestsSend(idA);
		const requestsReceived: IRequest[] = await this.userService.getFriendRequestsReceived(idA);
		requestsSend.forEach((request) => {
			if (request.receiverId === idB && request.state == "friend") {
				state = 1;
			}
			else if (request.receiverId === idB) {
				state = 2;
			}
		})
		requestsReceived.forEach((request) => {
			if (request.senderId === idB && request.state == "friend") {
				state = 3;
			}
			else if (request.senderId === idB) {
				state = 4;
				requestId = request.id;
			}
		})
		return {state, requestId};
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

	async getRequestPendingSend(id: string): Promise<{friendshipId: string, friendId: string, friendName: string}[]> {
		const requestsSend: IRequest[] = await this.userService.getFriendRequestsSend(id);
		// if (requestsSend)
		const list: {friendshipId: string, friendId: string, friendName: string}[] = [];
		for (let link of requestsSend) {
			const receiver: UserEntity = await this.userService.findById(link.receiverId);
			if (link.state === "pending") {
				list.push({friendshipId: link.id, friendId: receiver.id, friendName : receiver.login});
			}
		}
		return list;
	}

	async getRequestPendingReceived(id: string): Promise<{friendshipId: string, friendId: string, friendName: string}[]> {
		const requestsReceived: IRequest[] = await this.userService.getFriendRequestsReceived(id);
		const list: {friendshipId: string, friendId: string, friendName: string}[] = [];
		for (let link of requestsReceived) {
			const sender: UserEntity = await this.userService.findById(link.senderId);
			if (link.state === "pending") {
				list.push({friendshipId: link.id, friendId: sender.id, friendName : sender.login});
			}
		}
		return list;
	}

	async findRequest(senderId: string, receiverId: string): Promise<FriendEntity> {
		const sender: UserEntity = await this.userService.findById(senderId);
		const receiver: UserEntity = await this.userService.findById(receiverId);
		// this.friendRepository.createQueryBuilder("friend")
		// .leftJoinAndSelect("friend.sender", "sender")
		// .leftJoinAndSelect("friend.receiver", "receiver")
		// .select("sender.id", "senderId")
		// .addSelect("receiver.id", "receiverId")
		// .getRawMany();
		return await this.friendRepository.findOne({where: {sender: sender, receiver: receiver}});
	}

	async updateRequest(requestToUpdate: string): Promise<void> {
		this.friendRepository.update({id: requestToUpdate}, {state: "friend"});
	}

	async deleteRequest(requestToUpdate: string): Promise<void> {
		this.friendRepository.delete({id: requestToUpdate});
	}
}
