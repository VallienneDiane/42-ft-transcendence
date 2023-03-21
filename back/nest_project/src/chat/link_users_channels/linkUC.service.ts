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

	
	public findAllByChannelId(channelId: string): Promise<LinkUCEntity[]> {
		return this.linkUCRepository.find({
			where: {
				channelId: channelId
			},
			order: {
				isOp: "ASC",
				userId: "ASC"
			}
			})
	}

	public findAllByUserId(userId: string): Promise<LinkUCEntity[]> {
		return this.linkUCRepository.find({
			where: {
				userId: userId
			},
			order: {
				isOp: "ASC",
				channelId: "ASC"
			}
		})
	}

	public findOne(channelId: string, userId: string): Promise<LinkUCEntity> {
		return this.linkUCRepository.findOne({
			where: {
				userId: userId,
				channelId: channelId
			}
		})
	}

	async doUserOp(channelId: string, userId: string): Promise<void> {
		this.linkUCRepository.update({channelId: channelId, userId: userId}, {isOp: true});
	}

	async doUserNoOp(channelId: string, userId: string): Promise<void> {
		this.linkUCRepository.update({channelId: channelId, userId: userId}, {isOp: false});
	}

	async deleteLink(channelId: string, userId: string): Promise<void> {
		this.findOne(channelId, userId).then( (found) => {
			this.linkUCRepository.delete({channelId: channelId, userId: userId});
		});
	}

	async deleteUser(userId: string): Promise<void> {
		this.linkUCRepository.delete({userId: userId});
	}

	async deleteChannel(channelId: string): Promise<void> {
		this.linkUCRepository.delete({channelId: channelId});
	}

}