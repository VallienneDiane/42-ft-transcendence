import { IsBoolean, IsNotEmpty, IsString, MaxLength } from "class-validator";

/**
 * DTO use for private matchmaking request
 */
export class PrivateGameRequestDTO {
	@IsString() @IsNotEmpty() @MaxLength(64) target: string;
	@IsBoolean() @IsNotEmpty() super_game_mode: boolean;
}

/**
 * DTO use for public matchmaking request
 */
export class PublicGameRequestDTO {
	@IsBoolean() @IsNotEmpty() super_game_mode: boolean;
}

/**
 * DTO use for sending input
 */
export class GameInputDTO {
	@IsString() @IsNotEmpty() @MaxLength(64) input: string;
}

export class SpectatorRequestDTO {
	@IsString() @IsNotEmpty() @MaxLength(64) player1_login: string;
}
