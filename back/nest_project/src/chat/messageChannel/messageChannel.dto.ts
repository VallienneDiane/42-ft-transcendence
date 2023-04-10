import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { UserDto } from "src/user/user.dto";
import { UserEntity } from "src/user/user.entity";
import { ChannelDto } from "../channel/channel.dto";


export class MessageChannelDto {
    readonly id: string;
    @IsNotEmpty() @IsString() readonly content: string;
    readonly date: Date;
    @IsNotEmpty() @IsString() readonly user: UserEntity;
    readonly channel: ChannelDto;
}