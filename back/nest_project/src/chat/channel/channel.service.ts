import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "src/user/user.entity";
import { Repository } from "typeorm";
import { ChannelEntity } from "./channel.entity";

@Injectable({})
export class ChannelService {
	constructor (
		@InjectRepository(ChannelEntity)
		private readonly channelRepository: Repository<ChannelEntity>,
	) {}

	public create(newChannel: ChannelEntity): Promise<ChannelEntity> {
		return this.channelRepository.save(newChannel);
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
		await this.channelRepository.update({id: channelId}, {normalUsers: users});
	}

	async addOpUser(user: UserEntity, channelId: string) {
		let	users = (await this.getOneById(channelId)).opUsers;
		users.push(user);
		await this.channelRepository.update({id: channelId}, {opUsers: users});
	}

	async delNormalUser(userId: string, channelId: string) {
		let users = (await this.getOneById(channelId)).normalUsers;
		users = users.filter((user) => {
			return user.id !== userId;
		})
		await this.channelRepository.update({id : channelId}, {normalUsers: users});
	}

	async delOpUser(userId: string, channelId: string) {
		let users = (await this.getOneById(channelId)).opUsers;
		users = users.filter((user) => {
			return user.id !== userId;
		})
		await this.channelRepository.update({id : channelId}, {opUsers: users});
	}
}