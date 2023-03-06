import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChannelEntity } from "./channel.entity";

@Injectable({})
export class ChannelService {
	constructor (
		@InjectRepository(ChannelEntity)
		private readonly channelRepository: Repository<ChannelEntity>
	) {}

	public create(newChannel: ChannelEntity): Promise<ChannelEntity> {
		return this.channelRepository.save(newChannel);
	}

	public getOneByName(channelName: string): Promise<ChannelEntity> {
		return this.channelRepository.findOne({where: {name: channelName}})
	}

	public getOneById(channelId: number): Promise<ChannelEntity> {
		return this.channelRepository.findOne({where: {id: channelId}});
	}

	async updateByName(channelToUpdate: string, newChannelConfig: ChannelEntity): Promise<void> {
		this.channelRepository.update({name: channelToUpdate}, newChannelConfig);
	}

	async updateById(channelToUpdate: number, newChannelConfig: ChannelEntity): Promise<void> {
		this.channelRepository.update({id: channelToUpdate}, newChannelConfig);
	}

	async deleteByName(channelName: string): Promise<void> {
		this.channelRepository.delete(channelName);
	}

	async deleteById(channelId: number): Promise<void> {
		this.channelRepository.delete(channelId);
	}

	public listChannels(): Promise<ChannelEntity[]> {
		return this.channelRepository.find();
	}
}