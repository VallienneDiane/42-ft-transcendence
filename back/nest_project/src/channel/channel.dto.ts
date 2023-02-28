import { IsNotEmpty, IsString } from "class-validator";
import { IChannel } from "./channel.interface";

export class ChannelDto {
	@IsNotEmpty() @IsString() readonly name: string;
	readonly content: string[];
	readonly userList: string[];
}