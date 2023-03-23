import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { UserDto } from "src/user/user.dto";
import { ChannelDto } from "../channel/channel.dto";


export class MessageChannelDto {
    readonly id: string;
    @IsNotEmpty() @IsString() readonly content: string;
    readonly date: Date;
    @IsNotEmpty() @IsString() readonly userId: string;
    readonly channel: ChannelDto;
}