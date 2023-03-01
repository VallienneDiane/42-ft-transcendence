import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class linkUCDto {
	readonly id: number;
	@IsNotEmpty() @IsString() readonly userName: string;
	@IsNotEmpty() @IsString() readonly channelName: string;
	readonly date: Date;
	@IsNotEmpty() @IsBoolean() readonly isOp: boolean;
}