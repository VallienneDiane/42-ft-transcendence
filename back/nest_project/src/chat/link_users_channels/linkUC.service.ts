import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LinkUCEntity } from "./linkUC.entity";

@Injectable()
export class LinkUCService {
	constructor (
		@InjectRepository(LinkUCEntity)
		private readonly linkUCRepository: Repository<LinkUCEntity>
	) {}

	
}