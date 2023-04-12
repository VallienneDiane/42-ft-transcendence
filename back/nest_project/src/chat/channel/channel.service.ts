import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { use } from "passport";
import { UserDto } from "src/user/user.dto";
import { UserEntity } from "src/user/user.entity";
import { NotBrackets, Repository } from "typeorm";
import { modifyChannelDto } from "../chat.gateway.dto";
import { MessageChannelEntity } from "../messageChannel/messageChannel.entity";
import { ChannelDto } from "./channel.dto";
import { ChannelEntity } from "./channel.entity";

@Injectable({})
export class ChannelService {
	constructor (
		@InjectRepository(ChannelEntity)
		private readonly channelRepository: Repository<ChannelEntity>,
	) {}

	// Add a new channel to database, don't forget to fill the newChannel.godUser
	async create(newChannel: ChannelDto): Promise<ChannelEntity> {
		if (newChannel.godUser == undefined)
			return null;
		return await this.channelRepository.save(newChannel);
	}

	async create2(newChannel: ChannelDto, creator: UserDto): Promise<ChannelEntity> {
		let entityToAdd: ChannelEntity = newChannel;
		entityToAdd.godUser = creator;
		return await this.channelRepository.save(entityToAdd);
	}

	// Finds first entity by a given channelName. If entity was not found in the database - returns null.
	public getOneByName(channelName: string): Promise<ChannelEntity> {
		return this.channelRepository.findOne({where: {name: channelName}})
	}

	// Finds first entity by a given channelID. If entity was not found in the database - returns null.
	public getOneById(channelId: string): Promise<ChannelEntity> {
		return this.channelRepository.findOne({where: {id: channelId}});
	}

	async updateByName(channelToUpdate: string, newChannelConfig: ChannelEntity): Promise<void> {
		this.channelRepository.update({name: channelToUpdate}, newChannelConfig);
	}

	async updateById(channelId: string, newChannelConfig: modifyChannelDto): Promise<void> {
		await this.channelRepository.update({id: channelId}, newChannelConfig);
	}

	async deleteByName(channelName: string): Promise<void> {
		this.channelRepository.delete(channelName);
	}

	async deleteById(channelId: string): Promise<void> {
		this.channelRepository.delete({id: channelId});
	}

	public listChannels(): Promise<ChannelEntity[]> {
		return this.channelRepository.find(
			{
				where: {
					inviteOnly: false,
				},
				order: {
					name: "ASC",
				}
			}
		);
	}

	async listChannelsWithUsers() {
		return await this.channelRepository
			.createQueryBuilder("channel")
			.leftJoinAndSelect("channel.godUser", "god")
			.leftJoinAndSelect("channel.opUsers", "op")
			.leftJoinAndSelect("channel.normalUsers", "normal")
			.getMany();
	}

	async listChannelsWhereUserIsNot(userId: string): Promise<ChannelEntity[]> {
		const allChannels = await this.listChannelsWithUsers();
		let channListToReturn: ChannelEntity[] = [];
		allChannels.forEach(channel => {
			if (!channel.inviteOnly
				&& channel.godUser.id != userId
				&& channel.opUsers.every((opUser) => {return opUser.id != userId})
				&& channel.normalUsers.every((normalUser) => {return normalUser.id != userId})
				) {
					channListToReturn.push(channel);
				}
		});
		return channListToReturn;
	}

	/**
	 * 
	 * @param channelId 
	 * @returns an array or UserEntity belong to this channel with theyre grade in this channel, a connected: boolean is available 
	 * to set it up later, it can be ignored either
	 */
	async listUsersInChannel(channelId: string, sorted: boolean): Promise<{user: UserEntity, status: string, connected: boolean}[]> {
		const godUser = await this.channelRepository
			.createQueryBuilder("channel")
			.leftJoinAndSelect("channel.godUser", "god")
			.select("god.*")
			.where("channel.id = :id", { id: channelId })
			.getRawOne();
		let opUsers: UserEntity[] = await this.channelRepository
			.createQueryBuilder("channel")
			.innerJoinAndSelect("channel.opUsers", "ops")
			.select("ops.*")
			.where("channel.id = :id", { id: channelId })
			.getRawMany();
		let normalUsers: UserEntity[] = await this.channelRepository
			.createQueryBuilder("channel")
			.innerJoinAndSelect("channel.normalUsers", "normal")
			.select("normal.*")
			.where("channel.id = :id", { id: channelId })
			.getRawMany();
		if (sorted) {
			opUsers.sort((a, b) => {
				return (a.login.localeCompare(b.login))
			});
			normalUsers.sort((a, b) => {
				return (a.login.localeCompare(b.login))
			});
		}
		let toReturn: {user: UserEntity, status: string, connected: boolean}[] = [];
		if (godUser)
		toReturn.push({user: godUser, status: "god", connected: false});
		opUsers.forEach(
			(user) => {
				toReturn.push({user: user, status: "op", connected: false});
			}
		);
		normalUsers.forEach(
			(user) => {
				toReturn.push({user: user, status: "normal", connected: false});
			}
		)
		return toReturn;
	}

	/**
	 * 
	 * @param channelId 
	 * @param userId 
	 * @returns the userEntity wich have the userId as id and his grade in this channelId  
	 * returns null if the user don't belong to this channel or if the channel doesn't exists
	 */
	async getUserInChannel(channelId: string, userId: string): Promise<{user: UserEntity, status: string}> {
		console.log("getUserInChannel: ", channelId, userId);
		const usersArray = await this.listUsersInChannel(channelId, false);
		for (let elt of usersArray) {
			if (elt.user.id == userId)
				return ({user: elt.user, status: elt.status});
		}
		return null;
	}

	async addNormalUser(user: UserEntity, channelId: string) {
		await this.channelRepository
			.createQueryBuilder()
			.relation(ChannelEntity, "normalUsers")
			.of(channelId)
			.add(user.id);
	}

	async addOpUser(user: UserEntity, channelId: string) {
		await this.channelRepository
			.createQueryBuilder()
			.relation(ChannelEntity, "opUsers")
			.of(channelId)
			.add(user.id)
	}

	async delNormalUser(userId: string, channelId: string) {
		await this.channelRepository
			.createQueryBuilder()
			.relation(ChannelEntity, "normalUsers")
			.of(channelId)
			.remove(userId)
	}

	async delOpUser(userId: string, channelId: string): Promise<boolean> {
		await this.channelRepository
			.createQueryBuilder()
			.relation(ChannelEntity, "opUsers")
			.of(channelId)
			.remove(userId);
		return false;
	}

	async addBannedUser(userId: string, channelId: string) {
		await this.channelRepository
			.createQueryBuilder()
			.relation(ChannelEntity, "bannedUsers")
			.of(channelId)
			.add(userId);
	}

	async delBannedUser(userId: string, channelId: string) {
		await this.channelRepository
			.createQueryBuilder()
			.relation(ChannelEntity, "bannedUsers")
			.of(channelId)
			.remove(userId);
	}

	async getBannedList(channelId: string): Promise<{id: string}[]> {
		return await this.channelRepository
			.createQueryBuilder("channel")
			.innerJoinAndSelect("channel.bannedUsers", "banned")
			.where("channel.id = :id", { id: channelId })
			.select("banned.id", "id")
			.getRawMany();
	}

	async getMutedList(channelId: string): Promise<{id: string}[]> {
		return await this.channelRepository
			.createQueryBuilder("channel")
			.innerJoinAndSelect("channel.usersMuted", "mute")
			.select("mute.id", "id")
			.where("channel.id = :id", { id: channelId })
			.getRawMany();
	}

	async findUserInBannedList(userId: string, channelId: string) : Promise<boolean> {
		const arrayBanned: {id: string}[] = await this.getBannedList(channelId);
		return arrayBanned.includes({id: userId});
	}

	async delUser(userId: string, channelId: string) {
		await this.delOpUser(userId, channelId);
		await this.delNormalUser(userId, channelId);
	}

	async upgradeUserOnChannel(user: UserEntity, channelId: string) {
		await this.delNormalUser(user.id, channelId);
		await this.addOpUser(user, channelId);
	}

	async downgradeUserOnChannel(user: UserEntity, channelId: string) {
		const channDeleted = await this.delOpUser(user.id, channelId);
		if (!channDeleted)
			await this.addNormalUser(user, channelId);
	}

	async getMessages(channelId: string): Promise<{date: Date, senderId: string, senderName: string, content: string}[]> {
		const msgs: {date: Date, senderId: string, senderName: string, content: string}[] = await this.channelRepository
			.createQueryBuilder("channel")
			.innerJoinAndSelect("channel.messages", "messages")
			.leftJoinAndSelect("messages.user", "sender")
			.select("messages.date", "date")
			.addSelect("sender.id", "senderId")
			.addSelect("sender.login", "senderName")
			.addSelect("content", "content")
			.where("channel.id = :id", { id: channelId })
			.orderBy("messages.date", "ASC")
			.getRawMany();
		return msgs;
	}

	async delUserMessages(user: UserEntity, channelId: string) {
		let channel = await this.getOneById(channelId);
		if (channel == null)
			return;
		let messages = channel.messages.filter(message => {
			return message.user == user;
		});
		await this.channelRepository
			.createQueryBuilder()
			.relation(ChannelEntity, "messages")
			.of(channelId)
			.remove(messages);
	}

}