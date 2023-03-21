import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class ChannelDto {
	readonly id: string;
	readonly date: Date;
	@IsNotEmpty() @IsString() readonly name: string;
	@IsString() readonly pass: string;
	@IsNotEmpty() @IsBoolean() readonly inviteOnly: boolean;
	@IsNotEmpty() @IsBoolean() readonly persistant: boolean;
}