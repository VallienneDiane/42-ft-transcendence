import { IsNotEmpty, IsString, IsEmail, IsUUID, MinLength, IsBoolean, IsNumber } from "class-validator";
import { ChannelDto } from "src/chat/channel/channel.dto";
import { MessageChannelEntity } from "src/chat/messageChannel/messageChannel.entity";
import { MessagePrivateEntity } from "src/chat/messagePrivate/messagePrivate.entity";
import { FriendEntity } from "../chat/relation/friend/friend.entity";
import { UserEntity } from "./user.entity";

export class UserDto {
    readonly id: string;
    @IsNumber() id42: number;
    @IsNotEmpty() @IsString() readonly login: string;
    @IsNotEmpty() @IsEmail() readonly email: string;
    @IsNotEmpty() @IsString() @MinLength(8) password: string; //@IsOptionnal
    readonly channelsAsNormal: ChannelDto[];
    readonly channelsAsOp: ChannelDto[];
    readonly channelsAsGod: ChannelDto[];
    readonly channelsAsBanned: ChannelDto[];
    readonly messagesReceived: MessagePrivateEntity[];
    readonly messagesSend: MessagePrivateEntity[];
    readonly messagesChannel: MessageChannelEntity[];
    @IsNotEmpty() @IsString() twoFactorSecret: string;
    @IsNotEmpty() @IsBoolean() isTwoFactorEnabled: boolean;
    @IsNotEmpty() @IsString() qrCode: string;
    @IsNotEmpty() avatarSvg: string;
    readonly requestsSend: FriendEntity[];
    readonly requestsReceived: FriendEntity[];
    readonly blockList: UserEntity[];
    readonly blockedMeList: UserEntity[];
}