import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class linkUCDto {
	readonly id: string;
	@IsNotEmpty() @IsString() readonly userId: string;
	@IsNotEmpty() @IsString() readonly channelId: string;
	readonly date: Date;
	@IsNotEmpty() @IsBoolean() readonly isOp: boolean;
}