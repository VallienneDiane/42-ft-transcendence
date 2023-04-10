import { UserEntity } from "src/user/user.entity";

export class CreateMatchDto {
	score_winner: number;
	score_looser: number;
	winner: UserEntity;
	looser: UserEntity;
}