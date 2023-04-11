import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class PrivateGameRequestDTO {
	@IsString() @IsNotEmpty() target: string;
	@IsBoolean() @IsNotEmpty() super_game_mode: boolean;
}

export class PublicGameRequestDTO {
	@IsBoolean() @IsNotEmpty() super_game_mode: boolean;
}

export class GameInputDTO {
	@IsString() @IsNotEmpty() input: string;
}

export class SharePlayersLoginDTO {
	@IsString() @IsNotEmpty() player1_login: string;
	@IsString() @IsNotEmpty() player2_login: string;
}