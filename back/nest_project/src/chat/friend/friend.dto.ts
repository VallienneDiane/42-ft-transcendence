import { IsNotEmpty, IsUUID } from "class-validator";

export class friendDto {
	@IsNotEmpty() @IsUUID() readonly userId: string;
}

export class friendshipDto {
	@IsNotEmpty() @IsUUID() readonly friendshipId: string;
}