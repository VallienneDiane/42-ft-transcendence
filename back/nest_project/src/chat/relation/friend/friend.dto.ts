import { IsNotEmpty, IsUUID } from "class-validator";

export class addFriendDto {
	@IsNotEmpty() @IsUUID() readonly senderId: string;
    @IsNotEmpty() @IsUUID() readonly receiverId: string;
}

export class friendDto {
	@IsNotEmpty() @IsUUID() readonly userId: string;
}