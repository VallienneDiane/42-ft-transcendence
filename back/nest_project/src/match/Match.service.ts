import { Injectable, Post } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "src/user/user.entity";
import { DataSource, Repository } from "typeorm";
import { CreateMatchDto } from "./CreateMatch.dto";
import { Match } from "./Match";

@Injectable()
export class MatchService {

	constructor(@InjectRepository(Match) private MatchRepository: Repository<Match>) {

	}

	findMatch() {}

	createMatch(matchdetails: CreateMatchDto) {
		let newMatch = this.MatchRepository.create({
			...matchdetails
		});
		return this.MatchRepository.save(newMatch);
	}
	
}