import { IsNotEmpty, IsUUID } from "class-validator";

export class friendDto {
	@IsNotEmpty() @IsUUID() readonly userId: string;
}