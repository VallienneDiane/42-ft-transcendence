import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AvatarEntity } from "./avatar.entity";

@Injectable({})
export class AvatarService {
    constructor (
        @InjectRepository(AvatarEntity)
        private readonly avatarRepository: Repository<AvatarEntity>,
    ) {}

    async create(avatar: string): Promise<AvatarEntity> {
        return this.avatarRepository.create({id: undefined, avatarSvg: avatar});
    }

    async update(id: string, newAvatar: string) {
        this.avatarRepository.update({id: id}, {avatarSvg: newAvatar});
    }
}