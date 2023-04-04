import { IsNotEmpty, IsString, IsEmail, IsUUID, MinLength, IsBoolean } from "class-validator";
import { ChannelDto } from "src/chat/channel/channel.dto";
import { MessageChannelEntity } from "src/chat/messageChannel/messageChannel.entity";
import { MessagePrivateEntity } from "src/chat/messagePrivate/messagePrivate.entity";

export class UserDto {
    @IsString() readonly id: string;
    @IsNotEmpty() @IsString() readonly login: string;
    @IsNotEmpty() @IsEmail() readonly email: string;
    @IsNotEmpty() @IsString() @MinLength(8) password: string;
    readonly channelsAsNormal: ChannelDto[];
    readonly channelsAsOp: ChannelDto[];
    readonly channelsAsGod: ChannelDto[];
    readonly messagesReceived: MessagePrivateEntity[];
    readonly messagesSend: MessagePrivateEntity[];
    readonly messagesChannel: MessageChannelEntity[];
    @IsNotEmpty() @IsString() twoFactorSecret: string;
    @IsNotEmpty() @IsBoolean() isTwoFactorEnabled: boolean;
    @IsNotEmpty() @IsString() qrCode: string;
    @IsNotEmpty() @IsString() avatarSvg: string;
}