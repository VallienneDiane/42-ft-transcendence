import { IsNotEmpty, IsString, IsEmail, IsUUID, MinLength, MaxLength, IsBoolean, IsNumber, IsOptional, IsAlpha, IsAlphanumeric, Matches } from "class-validator";
import { Optional } from "@nestjs/common";
import { Match } from "src/match/Match";
import { ChannelDto } from "src/chat/channel/channel.dto";
import { MessageChannelEntity } from "src/chat/messageChannel/messageChannel.entity";
import { MessagePrivateEntity } from "src/chat/messagePrivate/messagePrivate.entity";
import { MuteEntity } from "src/chat/mute/mute.entity";
import { FriendEntity } from "../chat/friend/friend.entity";
import { UserEntity } from "./user.entity";
import { AvatarEntity } from "./avatar/avatar.entity";

export class UserDto {
    @IsUUID() readonly id: string;
    @IsString() readonly id42: string;
    @IsNotEmpty() @IsString() @Matches('^[a-zA-Z0-9-_]+$') @MinLength(3) @MaxLength(15) readonly login: string;
    @IsNotEmpty() @IsEmail()  @MaxLength(50) readonly email: string;
    @IsNotEmpty() @IsString() @MinLength(6) @MaxLength(100) password: string;
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
    readonly avatarSvg: AvatarEntity;
    @Optional() wonMatches: Match[];
    @Optional() lostMatches: Match[];
    readonly requestsSend: FriendEntity[];
    readonly requestsReceived: FriendEntity[];
    readonly blockList: UserEntity[];
    readonly blockedMeList: UserEntity[];
    readonly mutedList: MuteEntity[];
}

export class SignUpDto {
    @IsNotEmpty() @IsString() @Matches(/^[a-zA-Z0-9-_]+$/) @MinLength(3) @MaxLength(15) readonly login: string;
    @IsNotEmpty() @IsEmail() readonly email: string;
    @IsNotEmpty() @IsString() @MinLength(6) @MaxLength(100) password: string;
    @IsOptional() @IsString() avatarSvg: string;
}

export class LoginDto {
    @IsNotEmpty() @IsString() @Matches(/^[a-zA-Z0-9-_]+$/) @MinLength(3) @MaxLength(15) readonly login: string;
    @IsNotEmpty() @IsString() @MinLength(6) @MaxLength(100) password: string;
}

export class SignUp42Dto {
    @IsNotEmpty() @IsString() readonly id42: string;
    @IsNotEmpty() @IsString() @Matches(/^[a-zA-Z0-9-_]+$/) @MinLength(3) @MaxLength(15) readonly login: string;
    @IsNotEmpty() @IsEmail() readonly email: string;
    @IsNotEmpty() avatarSvg: string;
}

export class UpdateLoginDto {
    @IsNotEmpty() @IsUUID() readonly id: string;
    @IsNotEmpty() @IsString() @Matches(/^[a-zA-Z0-9-_]+$/) @MinLength(3) @MaxLength(15) login: string;
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
    @IsNotEmpty() @IsUUID() id: string
}