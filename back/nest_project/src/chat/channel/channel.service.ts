import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserDto } from "src/user/user.dto";
import { UserEntity } from "src/user/user.entity";
import { Repository } from "typeorm";
import { MessageChannelDto } from "../messageChannel/messageChannel.dto";
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
	public create(newChannel: ChannelDto): Promise<ChannelEntity> {
		if (newChannel.godUser == undefined)
			return null;
		return this.channelRepository.save(newChannel);
	}

	public create2(newChannel: ChannelDto, creator: UserDto): Promise<ChannelEntity> {
		let entityToAdd: ChannelEntity = newChannel;
		entityToAdd.godUser = creator;
		return this.channelRepository.save(entityToAdd);
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

	async addNormalUser(user: UserEntity, channelId: string) {
		let	users = (await this.getOneById(channelId)).normalUsers;
		users.push(user);
		await this.channelRepository.update(
			{id: channelId},
			{normalUsers: users});
	}

	async addOpUser(user: UserEntity, channelId: string) {
		let chann = await this.getOneById(channelId);
		if (chann == null)
			return;
		let	users = chann.opUsers;
		users.push(user);
		await this.channelRepository.update(
			{id: channelId},
			{opUsers: users, opNumber: chann.opNumber + 1});
	}

	async delNormalUser(userId: string, channelId: string) {
		let chann = await this.getOneById(channelId);
		if (chann == null)
			return;
		let users =chann.normalUsers;
		let prevLenght = users.length;
		users = users.filter((user) => {
			return user.id !== userId;
		})
		if (users.length < prevLenght)
			await this.channelRepository.update(
				{id : channelId},
				{normalUsers: users});
	}

	async delOpUser(userId: string, channelId: string) {
		let chann = await this.getOneById(channelId);
		if (chann == null)
			return;
		let users = chann.opUsers;
		let prevLenght = users.length;
		users = users.filter((user) => {
			return user.id !== userId;
		})
		if (users.length < prevLenght) {
			let opNumber = chann.opNumber;
			if (opNumber == 1 && !chann.persistant)
				this.deleteById(channelId);
			else
				this.channelRepository.update(
					{id : channelId},
					{opUsers: users, opNumber: opNumber - 1});
		}
	}

	async delGodUser(userId: string, channelId: string) {
		let chann = await this.getOneById(channelId);
		if (chann == null)
			return;
		let user = chann.godUser;
		if (user != null && user.id == userId) {
			let opNumber = chann.opNumber;
			if (opNumber == 1 && !chann.persistant)
				this.deleteById(channelId);
			else
				this.channelRepository.update(
					{id : channelId},
					{godUser: null, opNumber: opNumber - 1});
		}
	}

	async delUser(userId: string, channelId: string) {
		this.delGodUser(userId, channelId);
		this.delOpUser(userId, channelId);
		this.delNormalUser(userId, channelId);
	}

	async addMessage(userId: string, content: string, channelId: string) {
		let channel = await this.getOneById(channelId);
		let message: MessageChannelEntity = {
			id: undefined,
			content: content,
			date: undefined,
			userId: userId,
			channel: channel
		}
		let messages = channel.messages;
		messages.push(message);
		this.channelRepository.update(
			{id : channelId},
			{messages: messages}
		);
	}

	async delUserMessages(userId: string, channelId: string) {
		let channel = await this.getOneById(channelId);
		if (channel == null)
			return;
		let messages = channel.messages.filter(message => {
			return message.userId !== userId;
		});
		this.channelRepository.update(
			{id: channelId},
			{messages: messages}
		);
	}
}