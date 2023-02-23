import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChannelEntity } from "./channel.entity";
import { ChannelDto } from "./channel.dto";
import { IMessage } from "./message.interface";
import { IChannel } from "./channel.interface";

@Injectable({})
export class ChannelService {
	constructor (
		@InjectRepository(ChannelEntity)
		private readonly channelRepository: Repository<ChannelEntity>
	) {}

	public create(newChannel: ChannelEntity): Promise<ChannelEntity> {
		return this.channelRepository.save(newChannel);
	}

	public findByName(name: string): Promise<ChannelDto> {
		return this.channelRepository.findOneBy({name});
	}

	public findAll(): Promise<ChannelEntity[]> {
		return this.channelRepository.find();
	}

	async addMessage(name: string, newMessage: IMessage): Promise<void> {
		(await this.channelRepository.findOneBy({name})).content.history.push(newMessage);
	}

	async addUser(name: string, newUser: string): Promise<void> {
		(await this.channelRepository.findOneBy({name})).content.userList.push(newUser);
	}
}