import { Inject, Injectable } from "@nestjs/common";
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
        @Inject(UserService)
        private readonly userService: UserService,
        @Inject(ChannelService)
        private readonly channelService: ChannelService
    ) {}

    private retypeAsId(entity : any): string {
        return entity.userId;
    }

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
    
    async getTimeLeftMuteLine(muteId: string): Promise<number> {
        const found = await this.muteRepository.findOne({where: {id: muteId}});
        if (!found)
            return 0;
        let secondLeft = found.deletedAt.getSeconds() - new Date().getSeconds();
        return (secondLeft > 0 ? secondLeft : 0);
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

    async getCurrentMutedInChannel(channelId: string): Promise<{id: string, time: number}[]> {
        const channelMute = await this.channelService.getMutedListWithJoin(channelId);
        let array: {id: string, time: number}[] = [];
        for (let elt of channelMute) {
            const eltUserId = this.retypeAsId(elt);
            const response = await this.getTimeLeftMuteLine(elt.id);
            if (response) {
                array.push({id: eltUserId, time: response});
            }
        }
        return array;
    }

    async muteUser(userId: string, channelId: string, minutes: number) {
        console.log("weojowed2");
        const channelMute = await this.channelService.getMutedListWithJoin(channelId);
        console.log(channelMute);
        let muteDate = new Date(new Date().getTime() + (minutes * 60000));
        for (let elt of channelMute) {
            const eltUserId = this.retypeAsId(elt);
            console.log(eltUserId, userId);
            if (eltUserId == userId) {
                console.log("fqwqwf'");
                this.muteRepository.update({id: eltUserId}, {deletedAt: muteDate});
                return;
            }
        }
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