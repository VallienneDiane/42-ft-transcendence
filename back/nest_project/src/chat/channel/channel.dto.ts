import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { UserDto } from "src/user/user.dto";
import { MessageChannelDto } from "../messageChannel/messageChannel.dto";
import { MuteEntity } from "../mute/mute.entity";

export class ChannelDto {
	@IsString() readonly id: string;
	@IsDate() readonly date: Date;
	@IsNotEmpty() @IsString() readonly name: string;
	@IsNotEmpty() @IsBoolean() readonly password: boolean;
	@IsString() readonly channelPass: string;
	@IsNotEmpty() @IsBoolean() readonly inviteOnly: boolean;
	readonly normalUsers: UserDto[];
	readonly opUsers: UserDto[];
	readonly godUser: UserDto;
	readonly bannedUsers: UserDto[];
	readonly usersMuted: MuteEntity[];
	readonly messages: MessageChannelDto[];
}