import { UserEntity } from "src/user/user.entity";

export class CreateMatchDto {
	score_winner: number;
	score_loser: number;
	winner: UserEntity;
	loser: UserEntity;
}