import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { channel } from "diagnostics_channel";
import { UserService } from "src/user/user.service";
import { Repository } from "typeorm";
import { ChannelService } from "../channel/channel.service";
import { MuteEntity } from "./mute.entity";

@Injectable({})
export class MuteService {
    constructor (
        @InjectRepository(MuteEntity)
        private readonly muteRepository: Repository<MuteEntity>,
        private readonly userService: UserService,
        private readonly channelService: ChannelService
    ) {}

    async checkMuteLine(muteId: string): Promise<boolean> {
        const found = await this.muteRepository.findOne({where: {id: muteId}});
        if (!found)
            return false;
        if (found.deletedAt < new Date()) {
            await this.muteRepository.delete({id: muteId});
            return false;
        }
        return true;
    }

    async findMuteRelation(userId: string, channelId: string): Promise<boolean> {
        const userMute = await this.userService.getMuteList(userId);
        const channelMute = await this.channelService.getMutedList(channelId);
        for (let elt of userMute) {
            for (let chanElt of channelMute) {
                if (elt.id == chanElt.id) {
                    return await this.checkMuteLine(elt.id);
                }
            }
        }
        return false;
    }

    async muteUser(userId: string, channelId: string, minutes: number) {
		let muteDate = new Date(new Date().getTime() + (minutes * 60000));
        const user = await this.userService.findById(userId);
        const channel = await this.channelService.getOneById(channelId);
        let mute: MuteEntity = {
            id: undefined,
            user: user,
            channel: channel,
            createdAt: undefined,
            deletedAt: muteDate
        }
        this.muteRepository.save(mute);
	}

    async unmuteUser(userId: string, channelId: string) {
		const userMute = await this.userService.getMuteList(userId);
        const channelMute = await this.channelService.getMutedList(channelId);
        for (let elt of userMute) {
            for (let chanElt of channelMute) {
                if (elt.id == chanElt.id) {
                    await this.muteRepository.delete({id: elt.id});
                }
            }
        }
	}
}