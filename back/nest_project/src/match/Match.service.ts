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

	findMatch() {
		return this.MatchRepository
			.createQueryBuilder("matchos")
			.leftJoinAndSelect("matchos.winner", "winner")
			.leftJoinAndSelect("matchos.loser", "loser")
			.getMany();
	}

	createMatch(matchdetails: CreateMatchDto) {
		let newMatch = this.MatchRepository.create({
			...matchdetails
		});
		return this.MatchRepository.save(newMatch);
	}
	
	async matchHistory(userId: string): Promise<{matchId: string, winnerId: string, winnerLogin: string, scoreWinner: number, loserId: string, loserLogin: string, scoreLoser: number}[]> {
		return await this.MatchRepository
			.createQueryBuilder("match")
			.innerJoinAndSelect("match.winner", "winner")
			.innerJoinAndSelect("match.loser", "loser")
			.where("winner.id = :winnerId", {winnerId: userId})
			.orWhere("loser.id = :loserId", {loserId: userId})
			.select("match.id", "matchId")
			.addSelect("winner.id", "winnerId")
			.addSelect("winner.login", "winnerLogin")
			.addSelect("match.score_winner", "scoreWinner")
			.addSelect("loser.id", "loserId")
			.addSelect("loser.login", "loserLogin")
			.addSelect("match.score_loser", "scoreLoser")
			.getRawMany();
	}

}