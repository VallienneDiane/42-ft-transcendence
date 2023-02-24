import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChannelEntity } from "./channel.entity";
import { ChannelDto } from "./channel.dto";
import { IMessage } from "./message.interface";
import { IChannel } from "./channel.interface";
import { Socket } from "socket.io";

function separateMessage(str: string): [string, string] {
	let value: [string, string];
	let index: number = str.indexOf(':');
	value[0] = str.substring(0, (index - 1));
	value[1] = str.substring(index + 1);
	return value;
}

function separateMessages(strs: string[]): [string, string][] {
	let value: [string, string][];
	for (let str in strs) {
		value.push(separateMessage(str));
	}
	return value;
}

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
		this.findByName(chanName)
		.then(
			data => {
				let parsedMessages = separateMessages(data.content);
				client.emit("initHistory", parsedMessages);
			}
		)
		.catch(
			() => {
				client.emit("notice", "an error occured");
			}
		);
	}

	//async addUserInChannel(chanName: string, )

	async addMessage(chanName: string, sender: string, newMessage: string): Promise<void> {
		let	twoOnOne: string = sender + ':' + newMessage;
		let MessageTab: string[] = [twoOnOne];
		let toAdd: ChannelEntity = this.channelRepository.create({name: chanName, content: MessageTab});
		await this.channelRepository.save(toAdd);
	}
}