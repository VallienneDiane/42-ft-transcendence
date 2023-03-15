import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChannelService } from "../channel/channel.service";
import { LinkUCEntity } from "./linkUC.entity";

@Injectable()
export class LinkUCService {
	constructor (
		@InjectRepository(LinkUCEntity)
		private readonly linkUCRepository: Repository<LinkUCEntity>,
	) {}

	public create(newLink: LinkUCEntity): Promise<LinkUCEntity> {
		return this.linkUCRepository.save(newLink);
	}

	public findAllByChannelName(channelName: string): Promise<LinkUCEntity[]> {
		return this.linkUCRepository.find({
			where: {
				channelName: channelName
			},
			order: {
				isOp: "ASC",
				userName: "ASC"
			}
			})
	}

	public findAllByUserName(userName: string): Promise<LinkUCEntity[]> {
		return this.linkUCRepository.find({
			where: {
				userName: userName
			},
			order: {
				isOp: "ASC",
				channelName: "ASC"
			}
		})
	}

	public findOne(channelName: string, userName: string): Promise<LinkUCEntity> {
		return this.linkUCRepository.findOne({
			where: {
				userName: userName,
				channelName: channelName
			}
		})
	}

	async changeChannelName(oldChannelName: string, newChannelName: string): Promise<void> {
		this.linkUCRepository.update({channelName: oldChannelName}, {channelName: newChannelName});
	}

	async changeUserName(oldUserName: string, newUserName: string): Promise<void> {
		this.linkUCRepository.update({userName: oldUserName}, {userName: newUserName});
	}

	async deleteLink(channelName: string, userName: string): Promise<void> {
		this.findOne(channelName, userName).then( (found) => {
			this.linkUCRepository.delete({channelName: channelName, userName: userName});
			// if (found.isOp)
			// 	this.channelService.downgradeOpByName(channelName);
		});
	}

	async deleteUser(userName: string): Promise<void> {
		this.linkUCRepository.delete({userName: userName});
	}

	async deleteChannel(channelName: string): Promise<void> {
		this.linkUCRepository.delete({channelName: channelName});
	}

}