import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserDto } from "src/user/user.dto";
import { UserEntity } from "src/user/user.entity";
import { NotBrackets, Repository } from "typeorm";
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

	async updateById(channelToUpdate: string, newChannelConfig: ChannelEntity): Promise<void> {
		this.channelRepository.update({id: channelToUpdate}, newChannelConfig);
	}

	async downgradeOpByName(channelName: string): Promise<void> {
		this.getOneByName(channelName).then( (found) => {
			if (found.opNumber == 1 && !found.persistant) {
				this.deleteById(found.id);
			}
			else
				this.channelRepository.update({name: channelName}, {opNumber: found.opNumber - 1});
		})
	}

	async downgradeOpById(id: string): Promise<void> {
		this.getOneById(id).then( (found) => {
			if (found.opNumber == 1 && !found.persistant) {
				this.deleteById(found.id);
			}
			else
				this.channelRepository.update({name: found.name}, {opNumber: found.opNumber - 1});
		})
	}

	async upgradeOpByName(channelName: string): Promise<void> {
		this.getOneByName(channelName).then( (found) => {
			this.channelRepository.update({name: channelName}, {opNumber: found.opNumber + 1});
		})
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
					hidden: false,
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

	async listChannelsWhereUserIsNot(user: UserEntity): Promise<ChannelEntity[]> {
		//console.log("listchannelwhere....", user.id);
		const allChannels = await this.listChannelsWithUsers();
		let channListToReturn: ChannelEntity[] = [];
		allChannels.forEach(channel => {
			if (!channel.hidden
				&& channel.godUser.id != user.id
				&& channel.opUsers.every((opUser) => {return opUser.id != user.id})
				&& channel.normalUsers.every((normalUser) => {return normalUser.id != user.id})
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
	async listUsersInChannel(channelId: string): Promise<{user: UserEntity, status: string, connected: boolean}[]> {
		const godUser: UserEntity = await this.channelRepository
			.createQueryBuilder("channel")
			.innerJoinAndSelect("channel.godUser", "god")
			.select("god")
			.where("channel.id = :id", { id: channelId })
			.getRawOne();
		let opUsers: UserEntity[] = await this.channelRepository
			.createQueryBuilder("channel")
			.innerJoinAndSelect("channel.opUsers", "ops")
			.select("ops")
			.where("channel.id = :id", { id: channelId })
			.getRawMany();
		let normalUsers: UserEntity[] = await this.channelRepository
			.createQueryBuilder("channel")
			.innerJoinAndSelect("channel.normalUsers", "normal")
			.select("normal")
			.where("channel.id = :id", { id: channelId })
			.getRawMany();
		opUsers.sort((a, b) => {
			return (a.login.localeCompare(b.login))
		});
		normalUsers.sort((a, b) => {
			return (a.login.localeCompare(b.login))
		});
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
		const usersArray = await this.listUsersInChannel(channelId);
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
		let chann = await this.getOneById(channelId);
		await this.channelRepository
			.createQueryBuilder()
			.relation(ChannelEntity, "opUsers")
			.of(channelId)
			.add(user)
		await this.channelRepository.update(
			{id: channelId},
			{opNumber: chann.opNumber + 1});
	}

	async delNormalUser(userId: string, channelId: string) {
		await this.channelRepository
			.createQueryBuilder()
			.relation(ChannelEntity, "normalUsers")
			.of(channelId)
			.remove(userId)
	}

	async delOpUser(userId: string, channelId: string): Promise<boolean> {
		let chann = await this.getOneById(channelId);
		if (chann == null)
			return;
		let opNumberToReduce = false;
		let users = chann.opUsers;
		for (let user of users) {
			if (user.id == userId) {
				opNumberToReduce = true;
				break;
			}
		}
		if (opNumberToReduce) {
			if (chann.opNumber == 1 && !chann.persistant) {
				await this.deleteById(channelId);
				return true;
			}
			else {	
				await this.channelRepository
					.createQueryBuilder()
					.relation(ChannelEntity, "opUsers")
					.of(channelId)
					.remove(userId);
				await this.channelRepository.update(
					{id: channelId},
					{opNumber: chann.opNumber - 1}
				)
			}
		}
		return false;
	}

	async delGodUser(userId: string, channelId: string) {
		let chann = await this.getOneById(channelId);
		if (chann == null)
			return;
		let user = chann.godUser;
		if (user != null && user.id == userId) {
			let opNumber = chann.opNumber;
			if (opNumber == 1 && !chann.persistant)
				await this.deleteById(channelId);
			else
				await this.channelRepository.update(
					{id : channelId},
					{godUser: null, opNumber: opNumber - 1});
		}
	}

	async delUser(userId: string, channelId: string) {
		await this.delGodUser(userId, channelId);
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

	async getMessages(channelId: string): Promise<{date: Date, sender: string, content: string}[]> {
		const msgs: {date: Date, sender: string, content: string}[] = await this.channelRepository
			.createQueryBuilder("channel")
			.innerJoinAndSelect("channel.messages", "messages")
			.leftJoinAndSelect("messages.user", "sender")
			.select("messages.date", "date")
			.addSelect("sender.login", "sender")
			.addSelect("content", "content")
			.where("channel.id = :id", { id: channelId })
			.orderBy("messages.date", "ASC")
			.getRawMany();
		console.log("msgs: ", msgs);
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