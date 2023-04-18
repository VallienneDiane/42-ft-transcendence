import { IsNotEmpty, IsString, IsEmail, IsUUID, MinLength, IsBoolean, IsNumber } from "class-validator";
import { ChannelDto } from "src/chat/channel/channel.dto";
import { MessageChannelEntity } from "src/chat/messageChannel/messageChannel.entity";
import { MessagePrivateEntity } from "src/chat/messagePrivate/messagePrivate.entity";
import { FriendEntity } from "../chat/relation/friend/friend.entity";
import { UserEntity } from "./user.entity";

export class UserDto {
    @IsUUID() readonly id: string;
    @IsString() readonly id42: string;
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

export class SignUpDto {
    @IsNotEmpty() @IsString() readonly login: string;
    @IsNotEmpty() @IsEmail() readonly email: string;
    @IsNotEmpty() @IsString() @MinLength(8) password: string;
}

export class SignUp42Dto {
    @IsNotEmpty() @IsString() readonly id42: string;
    @IsNotEmpty() @IsString() readonly login: string;
    @IsNotEmpty() @IsEmail() readonly email: string;
    @IsNotEmpty() avatarSvg: string;
}

export class UpdateLoginDto {
    @IsNotEmpty() @IsUUID() readonly id: string;
    @IsNotEmpty() @IsString() login: string;
}

export class UpdateAvatarDto {
    @IsNotEmpty() @IsUUID() readonly id: string;
    @IsNotEmpty() @IsString()  avatarSvg: string;
}

export class idDto {
    @IsNotEmpty() @IsUUID() readonly id: string;
}

export class id42Dto {
    @IsNotEmpty() @IsString() readonly id42: string;
}

export class LoginDto {
    @IsNotEmpty() @IsString() login: string;
}

export class LoadAvatarDto {
    @IsNotEmpty() @IsUUID() readonly id: string;
    @IsNotEmpty() @IsString() file: string;
}

export class codeApiDto {
    @IsNotEmpty() @IsString() readonly code: string;
}

export class VerifyCodeDto42 {
    @IsNotEmpty() @IsString() code: string
    @IsNotEmpty() @IsNumber() id42: string
}

export class VerifyCodeDto {
    @IsNotEmpty() @IsString() code: string
    @IsNotEmpty() @IsString() id: string
}