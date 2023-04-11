import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

/**
 * DTO use for private matchmaking request
 */
export class PrivateGameRequestDTO {
	@IsString() @IsNotEmpty() target: string;
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
	@IsString() @IsNotEmpty() input: string;
}
