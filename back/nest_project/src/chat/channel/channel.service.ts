import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { channel } from "diagnostics_channel";
import { Repository } from "typeorm";
import { LinkUCService } from "../link_users_channels/linkUC.service";
import { MessageService } from "../message/message.service";
import { ChannelEntity } from "./channel.entity";

@Injectable({})
export class ChannelService {
	constructor (
		@InjectRepository(ChannelEntity)
		private readonly channelRepository: Repository<ChannelEntity>,
		private messageService: MessageService,
		private linkUCService: LinkUCService
	) {}

	public create(newChannel: ChannelEntity): Promise<ChannelEntity> {
		return this.channelRepository.save(newChannel);
	}

	// Finds first entity by a given channelName. If entity was not found in the database - returns null.
	public getOneByName(channelName: string): Promise<ChannelEntity> {
		return this.channelRepository.findOne({where: {name: channelName}})
	}

	// Finds first entity by a given channelID. If entity was not found in the database - returns null.
	public getOneById(channelId: number): Promise<ChannelEntity> {
		return this.channelRepository.findOne({where: {id: channelId}});
	}

	async updateByName(channelToUpdate: string, newChannelConfig: ChannelEntity): Promise<void> {
		this.channelRepository.update({name: channelToUpdate}, newChannelConfig);
	}

	async updateById(channelToUpdate: number, newChannelConfig: ChannelEntity): Promise<void> {
		this.channelRepository.update({id: channelToUpdate}, newChannelConfig);
	}

	async downgradeOpByName(channelName: string): Promise<void> {
		this.getOneByName(channelName).then( (found) => {
			if (found.opNumber == 1 && !found.persistant)
				this.deleteByName(channelName);
			else
				this.channelRepository.update({name: channelName}, {opNumber: found.opNumber - 1});
		})
	}

	async upgradeOpByName(channelName: string): Promise<void> {
		this.getOneByName(channelName).then( (found) => {
			this.channelRepository.update({name: channelName}, {opNumber: found.opNumber + 1});
		})
	}

	async deleteByName(channelName: string): Promise<void> {
		this.channelRepository.delete(channelName);
		this.messageService.deleteChannel(channelName);
		this.linkUCService.deleteChannel(channelName);
	}

	async deleteById(channelId: number): Promise<void> {
		this.channelRepository.delete(channelId);
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
}