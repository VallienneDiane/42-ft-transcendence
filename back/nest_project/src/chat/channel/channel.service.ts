import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChannelEntity } from "./channel.entity";
import { ChannelDto } from "./channel.dto";
import { IMessage } from "./message.interface";
import { IChannel } from "./channel.interface";
import { Socket } from "socket.io";

@Injectable({})
export class ChannelService {
	constructor (
		@InjectRepository(ChannelEntity)
		private readonly channelRepository: Repository<ChannelEntity>
	) {}

	public create(newChannel: ChannelEntity): Promise<ChannelEntity> {
		return this.channelRepository.save(newChannel);
	}

	public findByName(name: string): Promise<ChannelEntity> {
		return this.channelRepository.findOneBy({name});
	}

	public findAll(): Promise<ChannelEntity[]> {
		return this.channelRepository.find();
	}

	public getHistory(chanName: string, client: Socket) {
		
	}

	//async addUserInChannel(chanName: string, )

}